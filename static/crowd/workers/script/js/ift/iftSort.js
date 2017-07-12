function iftQuickSort(value, index, i0, i1, order )
{
  var m, d, tmp;

  if( i0 < i1 ) {
    /* random index to avoid bad pivots.*/
    d = iftRandomInteger( i0, i1 );
    tmp = value[i0];
    value[i0] = value[d];
    value[d] = tmp;

    tmp = index[i0];
    index[i0] = index[d];
    index[d] = tmp;

    m = i0;

    if(order === IFT_INCREASING ) {
      for( d = i0 + 1; d <= i1; d++ ) {
	if( value[ d ] < value[ i0 ] ) {
	  m++;

        tmp = value[m];
        value[m] = value[d];
        value[d] = tmp;

        tmp = index[m];
        index[m] = index[d];
        index[d] = tmp;
	}
      }
    }
    else {
      for( d = i0 + 1; d <= i1; d++ ) {
	if( value[ d ] > value[ i0 ] ) {
	  m++;
        tmp = value[m];
        value[m] = value[d];
        value[d] = tmp;

        tmp = index[m];
        index[m] = index[d];
        index[d] = tmp;
	}
      }
    }

    tmp = value[m];
    value[m] = value[i0];
    value[i0] = tmp;

    tmp = index[m];
    index[m] = index[i0];
    index[i0] = tmp;

    iftQuickSort( value, index, i0, m - 1, order );
    iftQuickSort( value, index, m + 1, i1, order );
  }
}