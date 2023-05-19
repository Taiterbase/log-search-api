use actix_cors::Cors;
use actix_files::Files;
use actix_web::{web, App, HttpServer};
use std::io;

mod handlers {
    pub mod multi_log;
    pub mod single_log;
}

#[actix_web::main]
async fn main() -> io::Result<()> {
    let args: Vec<String> = std::env::args().collect();
    let port = if args.len() > 1 {
        args[1].clone()
    } else {
        "8080".to_string()
    };

    HttpServer::new(|| {
        App::new()
            .wrap(
                // blanket allow, we'll want to restrict this in a more serious environment
                Cors::default()
                    .allow_any_origin()
                    .allow_any_method()
                    .allow_any_header()
                    .supports_credentials(),
            )
            .route("/logs", web::get().to(handlers::single_log::log_lines))
            .route(
                "/multi-logs",
                web::get().to(handlers::multi_log::multi_log_lines),
            )
            .service(Files::new("/", "/var/log").show_files_listing())
    })
    .bind(format!("127.0.0.1:{}", port))?
    .run()
    .await
}
