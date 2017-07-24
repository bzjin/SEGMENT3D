/**
 @file
 @brief A description is missing here
 */

function iftSet() {
    this.elem = IFT_NIL;
    this.next = null;
}

function iftInsertSet(S, elem)
{
    var p = new iftSet();

    if (S === null){
        p.elem  = elem;
        p.next  = null;
    }else{
        p.elem  = elem;
        p.next  = S;
    }

    return p;
}

function iftRemoveSet(S)
{
    if (S !== null){
        return [S.elem,  S.next];
    } else {
        return [IFT_NIL, null];
    }
}

function iftRemoveSetElem(S, elem){
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

// Could be made efficient by sorting both sets and merging (Theta(n + mlg(m))).
// This implementation is Theta(mn)
function iftSetUnion(S1, S2){
    var S = null;

    var s = S1;
    while(s){
        S = iftInsertSet(S,s.elem);
        s = s.next;
    }

    s = S2;
    while(s){
        S = iftUnionSetElem(S,s.elem)[1];
        s = s.next;
    }

    return S;
}

function iftSetCopy(S){

    return iftSetUnion(S,null);
}

// Uses recursion to copy the set in order
function iftSetCopyOrdered(S)
{
    var newS = null, part_cpy = null;

    // For the empty set, return null
    if(S === null)
        return null;

    // Recrusively copy the n-1 elements of the set
    // excluding the current one
    part_cpy = iftSetCopyOrdered(S.next);

    // Copy the current element to the new set in the
    // appropriate position, given that newS
    // for now is null and S.elem will be inserted
    // at the beginning of the new set. Since
    // iftInsertSet always inserts at the beginning
    // we are ensuring that each element will be copied
    // backwards
    newS = iftInsertSet(newS, S.elem);

    // Attached the copied set after the newly added
    // element of newS and return it
    newS.next = part_cpy;

    return newS;
}

//Doesn't check for duplicates (faster than iftSetUnion)
function iftSetConcat(S1, S2){
    var S = null;

    var s = S1;
    while(s){
        S = iftInsertSet(S,s.elem);
        s = s.next;
    }

    s = S2;
    while(s){
        S = iftInsertSet(S,s.elem);
        s = s.next;
    }

    return S;
}


function iftUnionSetElem(S, elem)
{
    var aux = S;

    while (aux !== null) {
        if (aux.elem === elem)
            return [false, S];
        aux = aux.next;
    }

    S = iftInsertSet(S,elem);

    return [true, S];
}

function iftInvertSet(S)
{
    var set = null;

    while (S !== null) {
        var values = iftRemoveSet(S);
        var elem = values[0];
        S        = values[1];

        set = iftInsertSet(set, elem);
    }

    return set;
}

function iftSetHasElement(S, elem){
    var s = S;

    while(s != null){
        if(s.elem === elem)
            return true;

        s = s.next;
    }

    return false;
}

function iftSetSize(S){
    var s = S;

    var i = 0;
    while(s !== null){
        i++;
        s = s.next;
    }

    return i;
}





function iftSetToArray(S) {
    var n_elems = iftSetSize(S);
    array = iftAllocIntArray(n_elems);

    var sp = S;
    var i      = 0;
    while (sp !== null) {
        array[i++] = sp.elem;
        sp = sp.next;
    }

    return array;
}




function iftArrayToSet(array) {
    var S = null;

    // it is copied from back to front to keep the original order of the elements
    // because the Set insertion is always in the head
    for (vari = array.length - 1; i >= 0; i--) {
        S = iftInsertSet(S, array[i]);
    }

    return S;
}

function iftPrintSet(S)
{
    while (S !== null) {
        console.log("elem " + S.elem);
        S = S.next;
    }
}


/**
 * Created by tvspina on 1/20/17.
 */
