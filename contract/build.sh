#!/bin/bash
set -e

RUSTFLAGS='-C link-arg=-s' cargo build --target wasm32-unknown-unknown --release
cp target/wasm32-unknown-unknown/release/multisig.wasm ./res/
cp target/wasm32-unknown-unknown/release/multisig.wasm ./../src/wasm/
