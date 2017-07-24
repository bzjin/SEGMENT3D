/**
 * Created by tvspina on 2/4/17.
 */

function DelineationAlg(img, A) {
    this.fst = iftCreateImageForest(img, A);
    this.checkpoint = 0;
}


DelineationAlg.prototype.delineate = function(seeds, remSeeds) {
    var S = null;
    var remS = null;
    var i, elem;

    for(i = 0; i < seeds.length; i++) {
        elem = iftGetVoxelIndex(this.fst.img, seeds[i].elem);

        var label = seeds[i].label;
        var marker = seeds[i].marker;

        S = iftInsertLabeledSetMarkerAndHandicap(S, elem, label, marker, 0);
    }

    if(remSeeds !== null) {
        for (i = 0; i < remSeeds.length; i++) {
            elem = iftGetVoxelIndex(this.fst.img, remSeeds[i].elem);
            remS = iftInsertSet(remS, elem);
        }
    }

    iftDiffWatershed(this.fst, S, remS);
};

DelineationAlg.prototype.reset = function() {
    iftResetImageForest(this.fst);

    this.checkpoint = 0;
};
