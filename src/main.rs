use actix_files::Files;
use actix_web::{web, App, HttpServer};
use std::io;

mod handlers {
    pub mod multi_log;
    pub mod single_log;
}

#[actix_web::main]
async fn main() -> io::Result<()> {
    HttpServer::new(|| {
        App::new()
            .route("/logs", web::get().to(handlers::single_log::log_lines))
            .route(
                "/multi_logs",
                web::get().to(handlers::multi_log::multi_log_lines),
            )
            .service(Files::new("/", "/var/log").show_files_listing())
    })
    .bind("127.0.0.1:8080")?
    .run()
    .await
}
