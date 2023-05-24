use actix_web::{web, HttpResponse, Result};
use futures::stream::{FuturesUnordered, StreamExt};
use serde::Deserialize;

// todo: pull from a config file
const SERVERS: [&str; 3] = ["localhost:8081", "localhost:8082", "localhost:8083"];

#[derive(Deserialize)]
pub struct MultiLogRequest {
    filename: String,
    keyword: Option<String>,
    last: Option<usize>,
}

pub async fn multi_log_lines(
    req: web::Query<MultiLogRequest>,
) -> Result<HttpResponse, actix_web::Error> {
    println!("multi server request received");

    let mut futures: FuturesUnordered<_> = SERVERS
        .iter()
        .map(|server| {
            let url = format!(
                "http://{}/logs?filename={}&last={}&keyword={}",
                server,
                &req.filename,
                &req.last.unwrap_or(0),
                &req.keyword.as_ref().unwrap_or(&"".to_string())
            );
            async {
                let resp = reqwest::get(url).await.unwrap().text().await.unwrap();
                Ok::<_, actix_web::Error>(resp)
            }
        })
        .collect();

    let mut responses = Vec::new();

    while let Some(result) = futures.next().await {
        responses.push(result?);
    }

    Ok(HttpResponse::Ok().json(responses))
}
