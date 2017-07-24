const IFT_AXIS_X = 0;
const IFT_AXIS_Y = 1;
const IFT_AXIS_Z = 2;
const IFT_INFINITY_INT  = 2147483647;
const IFT_INFINITY_INT_NEG  = -2147483648;

const IFT_INFINITY_FLT  = Number.MAX_VALUE;
const IFT_INFINITY_FLT_NEG  = -Number.MAX_VALUE;

const IFT_INFINITY_DBL  = Number.MAX_VALUE;
const IFT_INFINITY_DBL_NEG  = -Number.MAX_VALUE;

const IFT_INTERIOR  =  0;
const IFT_EXTERIOR  = 1;
const IFT_BOTH      = 2;
const IFT_EPSILON = 0.0000001;
const IFT_WHITE = 0;
const IFT_GRAY  = 1;
const IFT_BLACK = 2;
const IFT_NIL   = -1;
const IFT_INCREASING  = 1;
const IFT_DECREASING  = 0;
const IFT_RANDOM_SEED = 213344;
const IFT_MAXWEIGHT   = 4095.0;
const IFT_PI          = 3.14159265358979323846;

function iftAlmostZero(v) {
    return Math.abs(v) <= IFT_EPSILON;
}

function iftSafeMod(a, n)
{
    var n_floor = Math.floor(n);
    var a_floor = Math.floor(a);
    var r = Math.floor(a_floor % n_floor);

    return (r >= 0) ? r : n_floor+r;
}

function iftError(msg, func) {
    var err_msg = func + ':' + msg;
    console.warn(err_msg);
    throw err_msg;
}

/**
 * @brief Vector operations defined as macros so that iftVoxels, iftVectors, and iftPoints may be used interchangeably.
 */
/**
 * @brief Subtracts point vec1 from vec2 (it works for iftVectors/iftVoxels/iftPoints).
 *
 * @author Thiago Vallin Spina
 * @date Mar 04, 2016
 * @ingroup Geometry
 *
 * @warning The result must be cast as an iftVoxel, iftVector, or iftPoint.
 */
function iftVectorSub(vec1, vec2) {
    return new THREE.Vector3().subVectors(vec1, vec2);
}

/**
 * @brief Adds points vec1 and vec2 (it works for iftVectors/iftVoxels/iftPoints).
 *
 * @author Thiago Vallin Spina
 * @date Mar 04, 2016
 * @ingroup Geometry
 *
 * @warning The result must be cast as an iftVoxel, iftVector, or iftPoint.
 */
function iftVectorSum(vec1, vec2) {
    return new THREE.Vector3().addVectors(vec1,vec2);
}

/**
 * @brief Computes the cross product between two voxels, points, or vectors.
 *
 * @author Thiago Vallin Spina (changed the macro function's name)
 * @date Mar 04, 2016
 *
 * @warning The result must be cast as an iftVoxel, iftVector, or iftPoint.
 */
function iftVectorCrossProd(vec1, vec2) {
    return THREE.Vector3().crossVectors(vec1, vec2);
}

/**
 * @brief Computes the inner product between two voxels, points, or vectors.
 *
 * @author Thiago Vallin Spina (changed the macro function's name)
 * @date Mar 04, 2016
 *
 * @warning The result must be cast as an iftVoxel, iftVector, or iftPoint.
 */
function iftVectorInnerProduct(a, b) {
    return a.dot(b);
}

/**
 * @brief Computes the Vector Magnitude from a voxel or point
 *
 * @author Thiago Vallin Spina
 * @date Mar 04, 2016
 * @ingroup Geometry
 *
 */
function iftVectorMagnitude(v)
{
    return v.length();
}

function iftMax(a,b) {
    return Math.max((a), (b));
}

function iftMin(a,b) {
    return Math.min((a), (b));
}

/**
 * @brief Tests if two iftVoxels are equal
 *
 * @author Thiago Vallin Spina
 * @date Apr 19, 2016
 *
 * @param p0 The first voxel
 * @param p1 The second voxel
 * @return True if their coordinates are the same
 */
function iftVoxelsAreEqual(p0, p1) {

    return iftAlmostZero(p0.x - p1.x) && iftAlmostZero(p0.y - p1.y) && iftAlmostZero(p0.z - p1.z);
}

function iftVoxelInBoundingBox(bb, v) {

    return v.x >= bb.begin.x && v.y >= bb.begin.y && v.z >= bb.begin.z && v.x <= bb.end.x && v.y <= bb.end.y && v.z <= bb.end.z;
}

function iftNextPowerOf2(val) {
    var nbits = 1;

    while ((1 << nbits) < val) {
        nbits++;
    }

    return 1 << nbits;
}

function iftRound(x) {
    return Math.round(x);
}

function iftNormalizationValue(maxval)
{
    var nbits=1;

    while ((1 << nbits) <= maxval) {
        nbits++;
    }

    if ((nbits > 1)&&(nbits < 8)){
        nbits = 8;
    }else{
        if ((nbits > 8)&&(nbits < 10)){
            nbits = 10;
        } else {
            if ((nbits > 10)&&(nbits < 12)){
                nbits = 12;
            } else {
                if ((nbits > 12)&&(nbits < 16)){
                    nbits = 16;
                } else {
                    if ((nbits > 16)&&(nbits < 24)){
                        nbits = 24;
                    } else {
                        if ((nbits > 24)&&(nbits < 32)){
                            nbits = 32;
                        } else {
                            if (nbits > 32){
                                iftError("Invalid number of bits","iftNumberOfBits");
                            }
                        }
                    }
                }
            }
        }
    }

    return ((1 << nbits) - 1); // (2 ^ nbits) - 1
}

function iftIsPowerOf2(value) {
    if (typeof value !== 'number') {
        iftError("Not a number", "iftIsPowerOf2");

        return "Not a number";
    }

    return !iftAlmostZero(value) && (value & (value - 1)) === 0;
}

function iftRandomInteger(i0, i1) {

    return Math.floor(Math.random() * (i1 - i0) + i0);
}

function iftIntArrayUnique(arr) {

    var n = arr.length;

    if (arr === null)
        iftError("Array is null", "iftIntArrayUnique");
    if (n <= 0)
        iftError("Number of Elements %d is <= 0", "iftIntArrayUnique", n);

    var v = iftAllocIntArray(n);
    var index = iftAllocIntArray(n);
    iftCopyIntArray(v, arr);

    v.sort();

    var m = 1, i;

    for (i = 1; i < n; i++) {
        if (v[i] > v[m - 1]) {
            v[m++] = v[i];
        }
    }

    var v_new = iftAllocIntArray(m);
    for(i = 0; i < m; i++) {
        v_new[i] = v[i];
    }

    return v_new;
}


function iftCountUniqueIntElems(arr) {
    var n = arr.length;
    var copy = iftAllocIntArray(n);

    iftCopyIntArray(copy, arr);

    var unique = iftIntArrayUnique(copy, n);

    return unique.length;
}


const MAX_NUM_LABELS = 256;

