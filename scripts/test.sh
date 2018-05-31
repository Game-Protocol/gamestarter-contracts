#!/usr/bin/env sh

# Exit script as soon as a command fails.
set -o errexit

# Executes cleanup function at script exit.
trap cleanup EXIT

cleanup() {
  # Kill the ganache instance that we started (if we started one and if it's still running).
  if [ -n "$ganache_pid" ] && ps -p $ganache_pid > /dev/null; then
    kill -9 $ganache_pid
  fi
}

start_ganache() {
    ganache-cli --defaultBalanceEther 1000000 "${accounts[@]}" > /dev/null &
    ganache_pid=$!
}

echo "Starting our own ganache instance"
start_ganache

truffle test "$@"