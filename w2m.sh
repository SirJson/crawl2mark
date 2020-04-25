#!/bin/bash

org=$PWD
ts-node src/w2m.ts $1 ../notedown
cd ../notedown
./update.ps1
cd $org
