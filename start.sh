#!/bin/bash
cargo run 8080 --release &
cargo run 8081 --release &
cargo run 8082 --release &
cargo run 8083 --release &
cd site
yarn build && yarn start
