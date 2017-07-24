/**
 * Created by tvspina on 1/17/17.
 */

function iftAllocIntArray(n) {
    var v = new Int32Array(n);

    for(var p = 0; p < n; p++) {
        v[p] = 0;
    }

    return v;
}

function iftAllocUShortArray(n) {
    var v = new Uint16Array(n);

    for(var p = 0; p < n; p++) {
        v[p] = 0;
    }

    return v;
}

function iftAllocCharArray(n) {
    var v = new Int8Array(n);

    for(var p = 0; p < n; p++) {
        v[p] = 0;
    }

    return v;
}

function iftAllocUCharArray(n) {
    var v = new Uint8Array(n);

    for(var p = 0; p < n; p++) {
        v[p] = 0;
    }

    return v;
}


function iftAllocFloatArray(n) {
    var v = new Float32Array(n);

    for(var p = 0; p < n; p++) {
        v[p] = 0;
    }

    return v;
}

function iftCopyIntArray(array_dst, array_src) {
    var i;
    for (i = 0; i < array_dst.length; i++)
        array_dst[i] = array_src[i];
}