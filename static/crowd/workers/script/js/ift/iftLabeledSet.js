/**
 * Created by tvspina on 1/20/17.
 */
/**
 @file
 @brief A description is missing here
 */

function iftLabeledSet() {
    this.elem = IFT_NIL;
    this.label = 0;
    this.marker = 0;
    this.handicap = 0;
    this.next = null;
}


function iftInsertLabeledSet(S, elem, label)
{
    var  p = new iftLabeledSet();

    if (S === null) {
        p.elem     = elem;
        p.label    = label;
        p.marker   = IFT_NIL;
        p.next     = null;
        p.handicap = 0;
    }else{
        p.elem     = elem;
        p.label    = label;
        p.marker   = IFT_NIL;
        p.next     = S;
        p.handicap = 0;
    }

    return p;
}

function iftInsertLabeledSetMarkerAndHandicap(S, elem, label, marker, handicap)
{
    var p = new iftLabeledSet();

    if (S === null)
    {
        p.elem     = elem;
        p.label    = label;
        p.marker   = marker;
        p.handicap = handicap;
        p.next     = null;
    } else{
        p.elem     = elem;
        p.label    = label;
        p.next     = S;
        p.marker   = marker;
        p.handicap = handicap;
    }

    return p;
}

function iftRemoveLabeledSet(S)
{
    if (S !== null){
        return [S.elem, S.label, S.next];
    } else {
        return [IFT_NIL, IFT_NIL, null];
    }
}


function iftRemoveLabeledSetElem(S, elem){
    var tmp = null, remove = null;

    tmp = S;
    if ( tmp.elem === elem ) {
        return S.next;
    } else {
        while( tmp.next.elem !== elem ) {
            tmp = tmp.next;
        }

        remove = tmp.next;
        tmp.next = remove.next;
    }

    return S;
}


function iftInsertSetIntoLabeledSet(S, label, T) {
    var node = S;

    while (node !== null) {
        [p, node] = iftRemoveSet(node);
        T = iftInsertLabeledSet(T, p, label);
    }

    return T;
}


function iftTranslateLabeledSet(S, img, disp_vec) {
    var T = null;

    var node = S;
    while (node !== null) {
        var v = iftGetVoxelCoord(img, node.elem);
        var trans_v = iftVectorSum(v, disp_vec);
        if (iftValidVoxel(img, trans_v)) {
            var p = iftGetVoxelIndex(img, trans_v);
            T = iftInsertLabeledSet(T, p, node.label);
        }
        node = node.next;
    }

    return T;
}


function iftConcatLabeledSet(S1, S2){
    if(S2 === null)
        return;

    var i = S2;
    while(i !== null){
        S1 = iftInsertLabeledSetMarkerAndHandicap(S1,i.elem,i.label,i.marker, i.handicap);
        i = i.next;
    }

    return S1;
}

/* Warning: S2 must be a subset of S1! */

function iftRemoveSubsetLabeledSet(S1, S2){
    if(S2 === null)
        return;

    var i = S2;
    while(i !== null){
        S1 = iftRemoveLabeledSetElem(S1,i.elem);
        i = i.next;
    }
}

function iftCopyLabeledSet(s){
    var lset = null;

    while(s !== null){
        lset = iftInsertLabeledSetMarkerAndHandicap(lset,s.elem,s.label,s.marker,s.handicap);
        s = s.next;
    }

    return lset;
}

function iftCopyOrderedLabeledSet(s){
    var lset = null;
    if(s === null)
        return lset;

    var i = s;
    var nelem = 0;
    while(i !== null){
        nelem++;
        i = i.next;
    }

    var elems = iftAllocIntArray(nelem);
    var labels = iftAllocIntArray(nelem);
    var markers = iftAllocIntArray(nelem);
    var handicap = iftAllocIntArray(nelem);
    i = s;
    var index = 0;
    while(i !== null){
        elems[index] = i.elem;
        labels[index] = i.label;
        markers[index] = i.marker;
        handicap[index] = i.handicap;
        index++;
        i = i.next;
    }

    for(index = nelem - 1; index >= 0; index--){
        lset = iftInsertLabeledSetMarkerAndHandicap(lset,elems[index],labels[index],markers[index], handicap[index]);
    }

    return lset;
}

function iftReverseLabeledSet(s){
    var lset = null;

    while(s !== null){
        lset = iftInsertLabeledSetMarkerAndHandicap(lset,s.elem,s.label,s.marker,s.handicap);
        s = s.next;
    }

    return lset;
}

function iftLabeledSetSize(s)
{
    var aux = s;
    var counter = 0;
    while (aux !== null)
    {
        counter++;
        aux = aux.next;
    }
    return counter;
}


function iftLabeledSetToSet(S, lb){
    var Snew = null;
    var s = S;

    while(s !== null){
        if(lb === s.label)
            Snew = iftInsertSet(Snew, s.elem);
        s = s.next;
    }

    return Snew;
}

function iftLabeledSetElemsToSet(S) {
    var Snew = null;
    var s = S;

    while(s !== null){
        Snew = iftInsertSet(Snew, s.elem);
        s = s.next;
    }

    return Snew;
}

function iftCopyLabels(S, lb){
    var Snew = null;
    var s = S;

    while(s !== null){
        if(lb === s.label) {
            Snew = iftInsertLabeledSet(Snew, s.elem, lb);
        }
        s = s.next;
    }

    return Snew;
}

function iftLabeledSetMarkersToSet(S, marker){
    var Snew = null;
    var s = S;

    while(s !== null){
        if(marker === s.marker) {
            Snew = iftInsertSet(Snew, s.elem);
        }
        s = s.next;
    }

    return Snew;
}

function iftCopyLabeledSetMarkers(S, marker) {
    var Snew = null;
    var s = S;

    while(s !== null){
        if(marker === s.marker) {
            Snew = iftInsertLabeledSetMarkerAndHandicap(Snew, s.elem, s.label, s.marker, s.handicap);
        }
        s = s.next;
    }

    return Snew;
}

function  iftLabeledSetHasElement(S, elem) {
    var s = S;
    while(s){
        if(s.elem === elem) {
            return 1;
        }

        s = s.next;
    }

    return 0;
}

function iftPrintLabeledSet(S)
{
    while (S !== null) {
        console.log("elem " + S.elem + " label " + S.label);
        S = S.next;
    }
}
