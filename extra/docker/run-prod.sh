#!/bin/bash
sudo docker run -it -p 1881:1880 -e DEST=prod --name gaia-prod exentriq/node-red-gaia
