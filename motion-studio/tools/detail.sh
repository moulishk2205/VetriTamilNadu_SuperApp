#!/bin/zsh
# tools/detail.sh <prefix>  → out/review/<prefix>_{writeon,evo,portrait,dash}.jpg (16 frames each, ~0.1 s apart through the delicate passages)
P=$1
mk() { rm -f out/still_*.png; node render.mjs --film film2 --at $2 >/dev/null 2>&1; node tools/chk.mjs out/review/_det >/dev/null 2>&1; mv out/review/_det_0.jpg out/review/${P}_$1.jpg; rm -f out/review/_det_*.jpg; echo out/review/${P}_$1.jpg; }
mk writeon 85.75,86.0,86.2,86.3,86.4,86.467,86.533,86.6,86.667,86.733,86.8,86.9,87.033,87.2,87.7,89.9
mk evo 90.0,90.2,90.3,90.333,90.4,90.5,90.533,90.6,90.633,90.733,90.833,90.933,91.233,91.333,91.433,91.8
mk portrait 79.3,79.5,79.6,79.667,79.733,79.8,79.867,79.933,80.0,80.067,80.133,80.233,80.4,80.8,84.5,85.2
mk dash 63.2,63.6,64.0,64.8,65.6,66.0,66.4,66.8,67.2,67.6,67.9,68.2,68.6,68.9,69.2,69.6
mk ident 93.8,95.2,95.5,95.7,95.85,96.0,96.2,96.4,96.5,96.6,96.7,96.8,96.9,97.1,97.6,99.5
