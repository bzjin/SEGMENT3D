/* Receives an image labelled from 0 to n and returns a labeled set with the n geodesic centers, ordered by decreasing distance to their respective borders.*/
function iftGeodesicCenters(label_image){
	var geo_centers = null;

	var nregions = iftMaximumValue(label_image);

	var dist = iftCreateImage(label_image.xsize,label_image.ysize,label_image.zsize);
	var root = iftCreateImage(label_image.xsize,label_image.ysize,label_image.zsize);
	var Q = iftCreateGQueue(IFT_QSIZE,dist);

	var adj_rel = null;
	if(iftIs3DImage(label_image))
		adj_rel = iftSpheric(1.0);
	else
		adj_rel = iftCircular(1.0);

	//Creates a distance map that is 0 in the (internal) borders and +infinity otherwise
	var  p;
	for(p = 0; p < label_image.n; p++){
		dist.val[p] = IFT_INFINITY_INT;

		var u = iftGetVoxelCoord(label_image, p);

		var  i;
		for(i = 1; i < adj_rel.n; i++){
			var v = iftGetAdjacentVoxel(adj_rel,u,i);

			if(iftValidVoxel(label_image,v)){
				var q = iftGetVoxelIndex(label_image,v);
				if((label_image.val[p] !== label_image.val[q]) && (dist.val[p] > 0)){
					dist.val[p] = 0;
					root.val[p] = p;
					iftInsertGQueue(Q,p);
				}
			}else if(dist.val[p] > 0){
				dist.val[p] = 0;
				root.val[p] = p;
				iftInsertGQueue(Q,p);
			}
		}
	}

	if(iftIs3DImage(label_image))
		adj_rel = iftSpheric(Math.sqrt(3.0));
	else
		adj_rel = iftCircular(Math.sqrt(2.0));

	while(!iftEmptyGQueue(Q)){
		p = iftRemoveGQueue(Q);

		var u = iftGetVoxelCoord(label_image,p);
		var r = iftGetVoxelCoord(label_image, root.val[p]);

		var i;
		for(i = 1; i < adj_rel.n; i++){
			var v = iftGetAdjacentVoxel(adj_rel,u,i);

			if(iftValidVoxel(label_image,v)){
				var q = iftGetVoxelIndex(label_image,v);

				if ((dist.val[q] > dist.val[p]) && (label_image.val[p] === label_image.val[q])){
					var tmp = (v.x-r.x)*(v.x-r.x) + (v.y-r.y)*(v.y-r.y) + (v.z-r.z)*(v.z-r.z);
					if (tmp < dist.val[q]){
						if(dist.val[q] !== IFT_INFINITY_INT)
						  iftRemoveGQueueElem(Q,q);

						dist.val[q] = tmp;
						root.val[q] = root.val[p];
						iftInsertGQueue(Q,q);
					}
				}
			}
		}
	}

	//Finds, for each region, the most distant pixel from its border
	var centers = iftAllocIntArray(nregions);
	var centers_distance = iftAllocIntArray(nregions);
	var i;
	for(i = 0; i < nregions; i++)
		centers_distance[i] = -1;

	for(p = 0; p < label_image.n; p++){
		var region = label_image.val[p] - 1;
		if(centers_distance[region] < dist.val[p]){
			centers[region] = p;
			centers_distance[region] = dist.val[p];
		}
	}


	//This array will be scrambled by quicksort
	var centers_index = iftAllocIntArray(nregions);
	for(i = 0; i < nregions; i++)
		centers_index[i] = i;

	//Sorts the centers in increasing order, so inserting them in order in the iftLabeledSet geo_centers gives us a decreasing order
	iftQuickSort(centers_distance, centers_index, 0,nregions - 1, IFT_INCREASING);

	for(i = 0; i < nregions; i++){
		var index = centers_index[i];

		geo_centers = iftInsertLabeledSet(geo_centers,centers[index],index + 1);
	}

	return geo_centers;
}
