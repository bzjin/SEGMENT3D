/**
 @file
 @brief A description is missing here
 */

function iftBMap() {
    this.val = null;
    this.n = 0;
    this.nbytes = 0;
}

function iftCreateBMap(n) {
    var b = null;
    b = new iftBMap();
    b.n        = n;
    b.nbytes   = n/8;
    if (n%8) b.nbytes++;
    b.val = iftAllocCharArray(b.nbytes);
    if (b.val === null){
        iftError(MSG_MEMORY_ALLOC_ERROR, "iftCreateBMap");
    }
    return b;
}

function iftFillBMap(b, value) {
    for (var p=0; p < b.nbytes; p++)
        b.val[p] = (value?0xff:0);
}

function iftCopyBMap(src) {
    var dst = iftCreateBMap(src.n);

    for (var p=0; p < src.nbytes; p++)
        dst.val[p] = src.val[p];

    return(dst);
}


function iftBMapValue(b,n) {
    return ((b.val[n>>3]&(1<<(n&0x07)))!=0);
}

function iftBMapSet0(b,n) {
    b.val[n>>3] &= ((~0)^(1<<(n&0x07)));
}
function iftBMapSet1(b,n) {
    b.val[n>>3]|=(1<<(n&0x07));
}

function iftBMapToggle(b,n) {
    b.val[n>>3]^=(1<<(n&0x07));
}
