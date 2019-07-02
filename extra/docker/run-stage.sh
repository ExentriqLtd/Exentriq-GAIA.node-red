#!/bin/bash
SPACE=$1
PORT=$2
VOLUME=GAIA_SPACE_$1
sudo docker run -it --mount source=$VOLUME,target=/data -p $PORT:1880 --name gaia-stage-space$SPACE exentriq/node-red-gaia
