function laplacianSmoothing(vertices, faces, niters, lambda) {
    var edges = [];
    var i, j, k;
    var vertices_tmp = new Float32Array(vertices.length);

    for( i = 0; i < vertices.length; i+= 3) {
        edges.push([]);
    }

    for( i = 0; i < faces.length; i+= 3) {
        var v1 = faces[i];
        var v2 = faces[i + 1];
        var v3 = faces[i + 2];

        // If v2 is not yet a neighbor of v1, then v2 is added as neighbor of v1 and vice-versa
        if(edges[v1].indexOf(v2) < 0) {
            edges[v1].push(v2);
            edges[v2].push(v1);
        }

        // If v3 is not yet a neighbor of v1, then v3 is added as neighbor of v1 and vice-versa
        if(edges[v1].indexOf(v3) < 0) {
            edges[v1].push(v3);
            edges[v3].push(v1);
        }
    }

    var dv = new THREE.Vector3();
    var u = new THREE.Vector3();
    var v = new THREE.Vector3();

    for(k = 0; k < niters; k++) {

        for (i = 0; i < edges.length; i++) {
            u.set(vertices[3 * i], vertices[3 * i + 1], vertices[3 * i + 2]);

            // If the vertex has neighbors, we smoothen its position
            if (edges[i].length > 0) {
                dv.set(0, 0, 0);

                for (j = 0; j < edges[i].length; j++) {
                    v.set(vertices[3 * edges[i][j]], vertices[3 * edges[i][j] + 1], vertices[3 * edges[i][j] + 2]);

                    dv.add(v);
                }

                dv.divideScalar(edges[i].length);

                dv.sub(u).multiplyScalar(lambda);
                u.add(dv);
            } // otherwise, we use the original one

            vertices_tmp[3 * i] 	= u.x;
            vertices_tmp[3 * i + 1] = u.y;
            vertices_tmp[3 * i + 2] = u.z;
        }
        vertices.set(vertices_tmp);
    }
}