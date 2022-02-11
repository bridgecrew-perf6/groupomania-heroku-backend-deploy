#!/bin/bash
if [ "$ENABLE_DEBUG" == "true" ]; then
	echo "Starting with debugger on port $AUX_PORT"
	exec with_ngrok node --inspect=$AUX_PORT server.js
else
	echo "Starting without debugger"
	exec node server.js
fi
