/**
 @file
 @brief A description is missing here
 */
/*
 Copyright (C) <2003> <Alexandre Xavier Falc�o>

 This program is free software; you can redistribute it and/or modify
 it under the terms of the GNU General Public License as published by
 the Free Software Foundation; either version 2 of the License, or
 (at your option) any later version.

 This program is distributed in the hope that it will be useful,
 but WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 GNU General Public License for more details.

 You should have received a copy of the GNU General Public License
 along with this program; if not, write to the Free Software
 Foundation, Inc., 59 Temple Place, Suite 330, Boston, MA  02111-1307  USA

 please see full copyright in COPYING file.
 -------------------------------------------------------------------------
 written by A.X. Falc�o <afalcao@ic.unicamp.br>, May 13th 2007

 This program is a collection of functions to create, destroy, and
 manipulate a priority queue.

 A priority queue Q consists of two data structures: a circular
 queue C and a table L that encodes all possible doubly-linked
 lists.

 Q requires that the maximum possible increment along the paths be a
 non-negative integer less than the number of buckets in C. An extra
 bucket is created to store infinity values (positive and negative)
 for the LIFO policy. The queue size increases dynamically whenever
 (maxvalue-minvalue) > (nbuckets-1).

 Q.C.first[i] gives the first element that is in bucket i.
 Q.C.last[i]  gives the last  element that is in bucket i.
 Q.C.nbuckets gives the number of buckets in C.
 Q.C.minvalue  gives the minimum value of a node in queue.
 Q.C.maxvalue  gives the maximum value of a node in queue.
 Q.C.tiebreak gives the FIFO or LIFO tie breaking policy
 Q.C.removal_policy gives the IFT_MINVALUE or IFT_MAXVALUE removal policy

 All possible doubly-linked lists are represented in L. Each bucket
 contains a doubly-linked list that is treated as a FIFO.

 Q.L.next[i]: the next element to i
 Q.L.prev[i]: the previous element to i
 Q.L.color[i]: the color of i (IFT_WHITE=never inserted, IFT_GRAY=inserted,
 IFT_BLACK=removed)
 Q.L.nelems: gives the total number of elements that can be
 inserted in Q (It is usually the number of pixels in a given image
 or the number of nodes in a graph)
 Q.L.img.val[i]: gives the value of element i in the graph.

 Insertions and updates are done in O(1).
 Removal may take O(K+1), where K+1 is the number of buckets.
 */
/** define queue to remove node with minimum value */
const IFT_MINVALUE  = 0;
/** define queue to remove node with maximum value */
const IFT_MAXVALUE  = 1;

const IFT_FIFOBREAK = 0;
const IFT_LIFOBREAK = 1;
/** define maximum size of the queue*/
const IFT_QSIZE     = 65536;

function iftSetTieBreak(a,b) {
    a.C.tiebreak=b;
}

function iftSetRemovalPolicy(a,b) {
    a.C.removal_policy=b;
}


function iftGQNode() {
    this.next = IFT_NIL;
    this.prev = IFT_NIL;
    this.color = IFT_WHITE;
}

function iftGDoublyLinkedLists(img, nelems) {
    this.next   = iftAllocIntArray(nelems);
    this.prev   = iftAllocIntArray(nelems);
    this.color  = iftAllocCharArray(nelems);
    this.img    = img;
}

function iftGCircularQueue(nbuckets) {
    this.first = iftAllocIntArray((nbuckets+1));
    this.last  = iftAllocIntArray((nbuckets+1));
    this.nbuckets = nbuckets;
    this.minvalue = 0;
    this.maxvalue = 0;
}

function iftGQueue() {
    this.L = null;
    this.C = null;
}

function iftCreateGQueue(nbuckets, img) {
    var Q = new iftGQueue();

    iftCreateGQueueInplace(Q, nbuckets, img);

    return(Q);
}

function iftCreateGQueueInplace(Q, nbuckets, img)
{
    if (Q != null)
    {
        Q.C = new iftGCircularQueue(nbuckets);
        Q.L = new iftGDoublyLinkedLists(img, img.n);

        if ( (Q.C.first != null) && (Q.C.last != null) )
        {
            iftResetGQueue(Q);
        }
        else
            iftError(IFT_MSG_MEMORY_ALLOC_ERROR, "iftCreateGQueueInplace");
    }
    else
        iftError(IFT_MSG_MEMORY_ALLOC_ERROR, "iftCreateGQueueInplace");

    /* default */

    iftSetTieBreak(Q,IFT_FIFOBREAK);
    iftSetRemovalPolicy(Q,IFT_MINVALUE);
}

function iftResetGQueue(Q)
{
    Q.C.minvalue = IFT_INFINITY_INT;
    Q.C.maxvalue = IFT_INFINITY_INT_NEG;

    /* No need for that, since the programmer might have changed them  */
    //    iftSetTieBreak(Q,FIFOBREAK);
    //    iftSetRemovalPolicy(Q,IFT_MINVALUE);
    for (var i=0; i < Q.C.nbuckets+1; i++)
        Q.C.first[i]=Q.C.last[i]= IFT_NIL;

    for (var i=0; i < Q.L.img.n; i++)
    {
        Q.L.next[i] =  Q.L.prev[i] = IFT_NIL;
        Q.L.color[i] = IFT_WHITE;
    }

}

function iftGrowGQueue(Q, nbuckets)
{
    var Q1 = iftCreateGQueue(nbuckets, Q.L.img);
    var i,bucket;

    Q1.C.minvalue  = Q.C.minvalue;
    Q1.C.maxvalue  = Q.C.maxvalue;
    Q1.C.tiebreak  = Q.C.tiebreak;
    Q1.C.removal_policy = Q.C.removal_policy;
    for (i=0; i<Q.C.nbuckets; i++)
        if (Q.C.first[i] != IFT_NIL)
        {
            bucket = iftSafeMod(Q.L.img.val[Q.C.first[i]], Q1.C.nbuckets);
            Q1.C.first[bucket] = Q.C.first[i];
            Q1.C.last[bucket]  = Q.C.last[i];
        }
    if (Q.C.first[Q.C.nbuckets] != IFT_NIL)
    {
        bucket = Q1.C.nbuckets;
        Q1.C.first[bucket] = Q.C.first[Q.C.nbuckets];
        Q1.C.last[bucket]  = Q.C.last[Q.C.nbuckets];
    }

    for (i=0; i < Q.L.img.n; i++) {
        Q1.L.next[i] = Q.L.next[i];
        Q1.L.prev[i] = Q.L.prev[i];
        Q1.L.color[i] = Q.L.color[i];
    }

    // Copying stuff back
    Q.C = Q1.C;
    Q.L = Q1.L;
}


function iftInsertGQueue(Q, elem)
{
    var bucket, minvalue=Q.C.minvalue, maxvalue=Q.C.maxvalue;

    if ((Q.L.img.val[elem] === IFT_INFINITY_INT) || (Q.L.img.val[elem] === IFT_INFINITY_INT_NEG)) {
        bucket = Q.C.nbuckets;
    }
    else
    {
        if (Q.L.img.val[elem] < minvalue)
            minvalue = Q.L.img.val[elem];
        if (Q.L.img.val[elem] > maxvalue)
            maxvalue = Q.L.img.val[elem];
        if ((maxvalue-minvalue) > (Q.C.nbuckets-1))
        {
            iftGrowGQueue(Q,2*(maxvalue-minvalue)+1);
            console.log("Warning: Doubling queue size\n");
        }
        if (Q.C.removal_policy===IFT_MINVALUE)
        {
            bucket=iftSafeMod(Q.L.img.val[elem],Q.C.nbuckets);
        }
        else
        {
            bucket=Q.C.nbuckets-1-(iftSafeMod(Q.L.img.val[elem],Q.C.nbuckets));
        }
        Q.C.minvalue = minvalue;
        Q.C.maxvalue = maxvalue;
    }
    if (Q.C.first[bucket] === IFT_NIL)
    {
        Q.C.first[bucket]   = elem;
        Q.L.prev[elem]      = IFT_NIL;
    }
    else
    {
        Q.L.next[Q.C.last[bucket]] = elem;
        Q.L.prev[elem]             = Q.C.last[bucket];
    }

    Q.C.last[bucket]    = elem;
    Q.L.next[elem]      = IFT_NIL;
    Q.L.color[elem]     = IFT_GRAY;
}

function iftRemoveGQueue(Q)
{
    var elem= IFT_NIL, next, prev;
    var last, current;

    if (Q.C.removal_policy===IFT_MINVALUE)
        current=iftSafeMod(Q.C.minvalue,Q.C.nbuckets);
    else
        current=Q.C.nbuckets-1-iftSafeMod(Q.C.maxvalue,Q.C.nbuckets);

    /** moves to next element **/

    if (Q.C.first[current] === IFT_NIL)
    {
        last = current;

        current = iftSafeMod(current + 1, Q.C.nbuckets);

        while ((Q.C.first[current] === IFT_NIL) && (current != last))
        {
            current = iftSafeMod(current + 1, Q.C.nbuckets);
        }

        if (Q.C.first[current] != IFT_NIL)
        {
            if (Q.C.removal_policy===IFT_MINVALUE)
                Q.C.minvalue = Q.L.img.val[Q.C.first[current]];
            else
                Q.C.maxvalue = Q.L.img.val[Q.C.first[current]];
        }
        else
        {
            if (Q.C.first[Q.C.nbuckets] != IFT_NIL)
            {
                current = Q.C.nbuckets;
                if (Q.C.removal_policy===IFT_MINVALUE)
                    Q.C.minvalue = Q.L.img.val[Q.C.first[current]];
                else
                    Q.C.maxvalue = Q.L.img.val[Q.C.first[current]];
            }
            else
            {
                iftError("iftGQueue is empty","iftRemoveGQueue");
            }
        }
    }

    if (Q.C.tiebreak === IFT_LIFOBREAK)
    {
        elem = Q.C.last[current];
        prev = Q.L.prev[elem];
        if (prev === IFT_NIL)           /* there was a single element in the list */
        {
            Q.C.last[current]   = Q.C.first[current]  = IFT_NIL;
        }
        else
        {
            Q.C.last[current]   = prev;
            Q.L.next[prev]      = IFT_NIL;
        }
    }
    else   /* Assume FIFO policy for breaking ties */
    {
        elem = Q.C.first[current];
        next = Q.L.next[elem];
        if (next === IFT_NIL)           /* there was a single element in the list */
        {
            Q.C.first[current]  = Q.C.last[current]  = IFT_NIL;
        }
        else
        {
            Q.C.first[current]  = next;
            Q.L.prev[next]      = IFT_NIL;
        }
    }

    Q.L.color[elem] = IFT_BLACK;

    return elem;
}

function iftRemoveGQueueElem(Q, elem)
{
    var prev,next,bucket;

    if ((Q.L.img.val[elem] === IFT_INFINITY_INT) || (Q.L.img.val[elem] === IFT_INFINITY_INT_NEG))
        bucket = Q.C.nbuckets;
    else
    {
        if (Q.C.removal_policy === IFT_MINVALUE)
            bucket = iftSafeMod(Q.L.img.val[elem],Q.C.nbuckets);
        else
            bucket = Q.C.nbuckets-1-iftSafeMod(Q.L.img.val[elem],Q.C.nbuckets);
    }

    prev = Q.L.prev[elem];
    next = Q.L.next[elem];

    /* if elem is the first element */
    if (Q.C.first[bucket] === elem)
    {
        Q.C.first[bucket] = next;
        if (next === IFT_NIL) /* elem is also the last one */
            Q.C.last[bucket] = IFT_NIL;
        else
            Q.L.prev[next] = IFT_NIL;
    }
    else    /* elem is in the middle or it is the last */
    {
        Q.L.next[prev] = next;
        if (next === IFT_NIL) /* if it is the last */
            Q.C.last[bucket] = prev;
        else
            Q.L.prev[next] = prev;
    }

    Q.L.color[elem] = IFT_BLACK;

}

function iftEmptyGQueue(Q)
{
    var last,current;

    if (Q.C.removal_policy === IFT_MINVALUE)
        current=iftSafeMod(Q.C.minvalue,Q.C.nbuckets);
    else
        current=Q.C.nbuckets - 1 - (iftSafeMod(Q.C.maxvalue,Q.C.nbuckets));

    if (Q.C.first[current] != IFT_NIL)
        return 0;

    last = current;

    current = iftSafeMod(current + 1, Q.C.nbuckets);

    while ((Q.C.first[current] === IFT_NIL) && (current != last))
    {
        current = iftSafeMod(current + 1, Q.C.nbuckets);
    }

    if (Q.C.first[current] === IFT_NIL)
    {
        if (Q.C.first[Q.C.nbuckets] === IFT_NIL)
        {
            //Changed by Falcao and Nikolas
            // iftResetGQueue(Q);
            return(1);
        }
    }

    return (0);
}
