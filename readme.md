## Benchmarks

Tested on a M1 Pro Max with 32Gb of RAM.

Benchmarks made possible by log file supporters:
Shilin He, Jieming Zhu, Pinjia He, Michael R. Lyu. Loghub: A Large Collection of System Log Datasets towards Automated Log Analytics. Arxiv, 2020.

### HDFS.1 (Hadoop Distributed File System) 1.47GB

`curl "http://localhost:8080/logs?filename=test_logs/HDFS.log&last=10000000"`

| File Name | File Size | Lines Returned | Query Latency |
| --------- | --------- | -------------- | ------------- |
| HDFS.log  | 1504.88mb | 100            | 1.041792ms    |
| HDFS.log  | 1504.88mb | 1000           | 8.80775ms     |
| HDFS.log  | 1504.88mb | 10000          | 35.814584ms   |
| HDFS.log  | 1504.88mb | 100000         | 207.587042ms  |
| HDFS.log  | 1504.88mb | 1000000        | 1.790500083s  |
| HDFS.log  | 1504.88mb | 10000000       | 15.862125209s |
| HDFS.log  | 1504.88mb | 11175630       | 16.738370792s |

#### Concurrent requests

| File Name | File Size | Lines Returned | Concurrent Queries | Query Latency |
| --------- | --------- | -------------- | ------------------ | ------------- |
| HDFS.log  | 1504.88mb | 10000000       | 10                 | 16.307200708s |
| HDFS.log  | 1504.88mb | 11175630       | 10                 | 19.376387916s |

### HDFS.2 (Hadoop Distributed File System) 16.06GB

[src/main.rs:85] &req.filename = "install.log"
[src/main.rs:85] elapsed_time = 572.818167ms

### 3. Spark 2.75GB

### 5. BGL (Blue Gene/L) 708.76MB

### 6. HPC (High Performance Computing) 32.00MB

### 7. Windows 26.09GB
