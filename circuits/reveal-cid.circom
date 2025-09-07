pragma circom 2.2.2;

include "poseidon.circom";

template RevealCID() {
    signal input cid;
    signal input salt;
    signal input commitment;
    signal output isValid;

    component hasher = Poseidon(2);
    hasher.inputs[0] <== cid;
    hasher.inputs[1] <== salt;

    commitment === hasher.out;
    isValid <== 1;
}

component main = RevealCID();
