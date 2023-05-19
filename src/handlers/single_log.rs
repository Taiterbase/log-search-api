use actix_web::{web, HttpResponse, Result};
use serde::Deserialize;
use std::env::consts::OS;
use std::fs::File;
use std::io::{self, Read, Seek, SeekFrom};
use std::time::Instant;

const CHUNK_SIZE: u64 = 8192; // 8kb, works well for larger files

#[derive(Deserialize)]
pub struct LogsRequest {
    filename: String,
    keyword: Option<String>,
    last: Option<usize>,
}

pub async fn log_lines(req: web::Query<LogsRequest>) -> Result<HttpResponse, io::Error> {
    println!("single server request received");
    let path = format!("/var/log/{}", req.filename);
    let canonical_path = std::fs::canonicalize(&path)?;

    // Check if the canonical path still starts with the base directory path.
    // This is a more robust check than a simple ".." containment check.
    let base_dir = if OS == "macos" {
        "/private/var/log/".to_string()
    } else if OS == "linux" {
        "/var/log/".to_string()
    } else if OS == "windows" {
        "C:\\Windows\\System32\\config\\".to_string()
    } else {
        return Ok(HttpResponse::BadRequest().body("Unsupported OS"));
    };

    if !canonical_path.starts_with(base_dir) {
        return Ok(HttpResponse::BadRequest().body("Bad Request"));
    }

    let start_time = Instant::now();

    let mut file: File = File::open(&path)?;
    let file_size_mb =
            // truncate to 2 decimal places
            f64::trunc(file.metadata()?.len() as f64 / (1024.0 * 1024.0) * 100.0) / 100.0;
    let mut buf: Vec<u8> = Vec::new();
    let mut lines: Vec<String> = Vec::new();
    let mut position: u64 = file.metadata()?.len();

    while position > 0 {
        let chunk_size: u64 = if position >= CHUNK_SIZE {
            CHUNK_SIZE
        } else {
            position
        };

        position = position.saturating_sub(chunk_size);

        file.seek(SeekFrom::Start(position))?;
        buf.resize(chunk_size as usize, 0);
        file.read_exact(&mut buf)?;

        let mut chunk_lines: Vec<String> = buf
            // will want to consider replacing \r\n with \n and/or \n with \r\n depending on the system.
            // \n works for now since our output is consumed by browsers.
            .split(|b: &u8| *b == b'\n')
            .map(|s: &[u8]| String::from_utf8_lossy(s).into_owned())
            .collect();

        if !lines.is_empty() {
            // the first line may be incomplete, append it to the last line of the next chunk
            let first_line = chunk_lines.pop().unwrap();
            let last_line: &mut String = lines.last_mut().unwrap();
            last_line.insert_str(0, &first_line);
        }

        // newest lines to oldest lines
        chunk_lines.reverse();
        lines.append(&mut chunk_lines);

        // fast path to return the last N lines
        // greatly reduces the amount of lines we need to traverse
        if let Some(last) = req.last {
            if lines.len() >= last {
                break;
            }
        }
    }

    lines = lines
        .into_iter()
        .filter(|line: &String| {
            req.keyword
                .as_ref()
                .map_or(true, |keyword: &String| line.contains(keyword))
        })
        .collect();

    if let Some(last) = req.last {
        lines.truncate(last);
    }

    let elapsed_time = start_time.elapsed();
    let lines_read = lines.len();
    println!(
        "{:?} ({:?}mb): {:?} | {:?}",
        &req.filename, file_size_mb, lines_read, elapsed_time
    );

    Ok(HttpResponse::Ok().json(lines))
}
