#!/bin/bash
PORT=3001 NODE_ENV=production node index.ts &
PORT=3002 NODE_ENV=production node index.ts &
PORT=3003 NODE_ENV=production node index.ts &
PORT=3004 NODE_ENV=production node index.ts &
