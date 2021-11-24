#!/bin/bash

rm -rf ./docs
hexo generate
mv ./public ./docs
