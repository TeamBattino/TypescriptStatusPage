#!/bin/bash

# Get the current directory
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"

# Add the cron job
(crontab -l 2>/dev/null; echo "*/10 * * * * cd $DIR && bun start") | crontab -