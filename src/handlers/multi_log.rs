use actix_web::{web, HttpResponse, Result};
use futures::stream::{FuturesUnordered, StreamExt};
use serde::Deserialize;

#[derive(Deserialize)]
pub struct MultiLogRequest {
    servers: Vec<String>,
    filename: String,
    keyword: Option<String>,
    last: Option<usize>,
}

pub async fn multi_log_lines(
    info: web::Query<MultiLogRequest>,
) -> Result<HttpResponse, actix_web::Error> {
    let mut futures: FuturesUnordered<_> = info
        .servers
        .iter()
        .map(|server| {
            let url = format!(
                "http://{}/logs?filename={}&last={}&keyword={}",
                server,
                &info.filename,
                &info.last.unwrap_or(0),
                &info.keyword.as_ref().unwrap_or(&"".to_string())
            );
            let mut url = reqwest::Url::parse(&url).unwrap();
            if let Some(keyword) = &info.keyword {
                url.query_pairs_mut().append_pair("keyword", keyword);
            }
            if let Some(last) = info.last {
                url.query_pairs_mut().append_pair("last", &last.to_string());
            }

            async {
                let resp = reqwest::get(url)
                    .await
                    .map_err(|err| actix_web::error::ErrorInternalServerError(err))?
                    .json::<Vec<String>>()
                    .await
                    .map_err(|err| actix_web::error::ErrorInternalServerError(err))?;
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
