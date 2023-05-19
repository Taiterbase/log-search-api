use std::fs::File;
use std::io::{self, Read, Seek, SeekFrom};
use std::time::Instant;

use actix_files as fs;
use actix_web::{web, App, HttpResponse, HttpServer, Result};
use serde::Deserialize;

#[derive(Deserialize)]
struct LogsRequest {
    filename: String,
    keyword: Option<String>,
    last: Option<usize>,
}

const CHUNK_SIZE: u64 = 8192;

async fn log_lines(req: web::Query<LogsRequest>) -> Result<HttpResponse, io::Error> {
    let path = format!("/var/log/{}", req.filename);

    if path.contains("..") {
        // simple and unsophisticated way to prevent path traversal attacks
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
            // doesn't take into account other line endings
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

#[actix_web::main]
async fn main() -> io::Result<()> {
    HttpServer::new(|| {
        App::new()
            .route("/logs", web::get().to(log_lines))
            .service(fs::Files::new("/", "/var/log").show_files_listing())
    })
    .bind("127.0.0.1:8080")?
    .run()
    .await
}
