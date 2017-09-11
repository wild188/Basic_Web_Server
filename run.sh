#!/bin/bash
node staticServer.js > ./logs/staticserverLog.txt &
echo "Static server started with pid: $!"
disown
node server.js > ./logs/serverLog.txt &
echo "Server started with pid: $!"
disown