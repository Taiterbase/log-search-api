# Log Search

CLS is a log searching API that exposes one endpoint `/logs` that accepts a `filename`, `last`, and `keyword` query parameter. The `filename` is the name of the log file to search and the `last` parameter is the number of lines to return from the end of the file. `keyword` can be used to filter the results to only lines that contain the keyword.

![Completed Logs Viewer](./logs_viewer.png)

## Implementation Notes

I use a chunking strategy to read lines from the end of the file upwards until either the number of lines requested is reached or the beginning of the file is reached. This is done by reading chunks of the file from the end and splitting the chunk into lines. The lines are then reversed and returned.

## Running the rust-api

Install rustup and cargo: https://rustup.rs/

```bash
cd ./api/rust
cargo run 8080 --release

curl "http://localhost:8080/logs?filename={logname}&last=10000000"
curl "http://localhost:8080/logs?filename={logname}&last={last_n_entries}&keyword={keyword}"
```

## Running the node-api

```bash
cd ./api/node
yarn build
yarn start

curl "http://localhost:3001/logs?filename={logname}&last=10000000"
curl "http://localhost:3001/logs?filename={logname}&last={last_n_entries}&keyword={keyword}"
```

## Running the app's web interface

Install yarn: https://yarnpkg.com/getting-started/install

```bash
cd web
yarn install
yarn dev
```

## Running it all together

```bash
cd ./api/node
yarn build
cd ../../
cd web
yarn install
cd ../
yarn start
```

This will run 8 API servers in total on ports 8080, 8081, 8082, 8083, ports 3001, 3002, 3003, 3004, and the development server for the web interface will be available at http://localhost:3000 (if it isn't already taken).

You can test the multi-server API by running the following command:

#### Rust

```bash
curl "http://localhost:8080/logs/multi?filename={filename}&last={last_n_entries}&keyword={keyword}"
```

#### Node

```bash
curl "http://localhost:3001/logs/multi?filename={filename}&last={last_n_entries}&keyword={keyword}"
```

## Rust Benchmarks

Tested on a M1 Pro Max with 32Gb of RAM.

Benchmarks made possible by log file supporters:
Shilin He, Jieming Zhu, Pinjia He, Michael R. Lyu. Loghub: A Large Collection of System Log Datasets towards Automated Log Analytics. Arxiv, 2020.

### HDFS.1 (Hadoop Distributed File System) 1.47GB

`curl "http://localhost:8080/logs?filename=test_logs/HDFS.log&last=10000000"`

| File Name | File Size | Lines Returned | Query Latency |
| --------- | --------- | -------------- | ------------- |
| HDFS.log  | 1504.88mb | 100            | 53.958µs      |
| HDFS.log  | 1504.88mb | 1000           | 610.875µs     |
| HDFS.log  | 1504.88mb | 10000          | 6.902167ms    |
| HDFS.log  | 1504.88mb | 100000         | 33.906584ms   |
| HDFS.log  | 1504.88mb | 1000000        | 204.017792ms  |
| HDFS.log  | 1504.88mb | 10000000       | 1.989568459s  |
| HDFS.log  | 1504.88mb | 11175630       | 2.256178333s  |

#### Concurrent requests

| File Name | File Size | Lines Returned | Concurrent Queries | Query Latency |
| --------- | --------- | -------------- | ------------------ | ------------- |
| HDFS.log  | 1504.88mb | 10000000       | 10                 | 2.005238875s  |
| HDFS.log  | 1504.88mb | 11175630       | 10                 | 2.389033292s  |

### HPC (High Performance Computing) 32.00MB

[`curl "http://localhost:8080/logs?filename=test_logs/HPC.log&last=10000000"`

| File Name | File Size | Lines Returned | Query Latency |
| --------- | --------- | -------------- | ------------- |
| HPC.log   | 31.99mb   | 100            | 56.75µs       |
| HPC.log   | 31.99mb   | 1000           | 291.708µs     |
| HPC.log   | 31.99mb   | 10000          | 6.599458ms    |
| HPC.log   | 31.99mb   | 100000         | 31.516458ms   |
| HPC.log   | 31.99mb   | 433490         | 69.21975ms    |

## Node Benchmarks

### HDFS.1 (Hadoop Distributed File System) 1.47GB

`curl "http://localhost:3001/logs?filename=test_logs/HDFS.log&last=10000000"`

| File Name | File Size | Lines Returned | Query Latency |
| --------- | --------- | -------------- | ------------- |
| HDFS.log  | 1504.88mb | 100            | 178µs         |
| HDFS.log  | 1504.88mb | 1000           | 533µs         |
| HDFS.log  | 1504.88mb | 10000          | 6.457ms       |
| HDFS.log  | 1504.88mb | 100000         | 37.659ms      |
| HDFS.log  | 1504.88mb | 1000000        | 241.47ms      |
| HDFS.log  | 1504.88mb | 10000000       | 2.425s        |
| HDFS.log  | 1504.88mb | 11175630       | 3.231s        |

#### Concurrent requests

For `last` values of `1000000`, `10000000`, and `11175630` lengths, the Node server ran out of memory and crashed shortly after outputting its read time.

### HPC (High Performance Computing) 32.00MB

[`curl "http://localhost:8080/logs?filename=test_logs/HPC.log&last=10000000"`

| File Name | File Size | Lines Returned | Query Latency |
| --------- | --------- | -------------- | ------------- |
| HPC.log   | 31.99mb   | 100            | 163µs         |
| HPC.log   | 31.99mb   | 1000           | 534µs         |
| HPC.log   | 31.99mb   | 10000          | 5.897ms       |
| HPC.log   | 31.99mb   | 100000         | 33.938ms      |
| HPC.log   | 31.99mb   | 433490         | 110.766ms     |

## Rust Vs Node

Rust is able to handle more concurrent requests than Node, and is able to handle larger files without running out of memory.
Express.js and Node is faster for small concurrent requests smaller files, but Rust is faster for larger files. I may also not be configuring my Rust server correctly, so there is room for improvement.

## TODO

- Tests!
