"strict mode"


jq = jQuery.noConflict()

jq.fn.disable = -> @.each -> jq(@).prop 'disabled', no

jq.fn.enable = -> @.each -> jq(@).prop 'disabled', no


jq(document).ready ($) ->
  loadingBlock = $('#loadingBlock')
  errorBlock = $('#errorBlock')
  noAssignmentsBlock = $('#noAssignmentsBlock')
  sessionBlock = $('#sessionBlock')
  assignmentId = $('#assignmentId')
  tileEditorCanvas = $('#sessionBlock canvas')
  showSegmentation = $('#showSegmentation')
  undoButton = $('#undo')
  redoButton = $('#redo')
  clearSegmentation = $('#clearSegmentation')
  resetView = $('#resetView')
  zoomOut = $('#zoomOut')
  zoomIn = $('#zoomIn')
  selectAddTool = $('#selectAddTool')
  selectDelTool = $('#selectDelTool')
  selectStrokeTool = $('#selectStrokeTool')
  selectHandTool = $('#selectHandTool')
  selectMergeTool = $('#selectMergeTool')
  selectExtendTool = $('#selectExtendTool')
  selectSplitTool = $('#selectSplitTool')
  showScribbles = $('#showScribbles')
  selectAuxTool = $('#selectAuxTool')
  auxToolName = $('#auxToolName')
  eraseMode = $('#eraseMode')
  skipAssignment = $('#skipAssignment')
  skipConfirmationBlock = $('#skipConfirmationBlock')
  saveAssignment = $('#saveAssignment')
  saveConfirmationBlock = $('#saveConfirmationBlock')
  clearSegmentationBlock = $('#clearSegmentationBlock')
  useAuxToolBlock = $('#useAuxToolBlock')
  confirmationBlocks = $('.confirmationBlock')
  workerStats = $('#workerStats')
  workerScore = $('#workerScore')
  workerRanking = $('#workerRanking')
  rankingBlock = $('#rankingBlock')
  rankingBlock.hide()
  rank = $('#rank')
  noRankingBlock = $('#noRankingBlock')
  noRankingBlock.hide()
  view3DBorder = $('#view3DBorder')
  view3DMeshes = $('#view3DMeshes')
  view2DBorder = $('#view2DBorder')
  view2DLabel = $('#view2DLabel')

  fixateClippingPlane = $('#fixateClippingPlane')
  setClippingPlaneXY = $('#setClippingPlaneXY')
  setClippingPlaneZX = $('#setClippingPlaneZX')
  setClippingPlaneYZ = $('#setClippingPlaneYZ')

  curKey = null
  tileEditor =
    selectedTool : null
    previousOverlay: null

#  auxTool = undefined

  currSessionId = undefined
  currCsrfToken = undefined

  csrfSafeMethod = (method) ->
    # these HTTP methods do not require CSRF protection
    /^(GET|HEAD|OPTIONS|TRACE)$/  .test method

  getCookie = (name) ->
    cookieValue = null
    if document.cookie and document.cookie != ''
      cookies = document.cookie.split(';')
      i = 0
      while i < cookies.length
        cookie = jQuery.trim(cookies[i])
        # Does this cookie string begin with the name we want?
        if cookie.substring(0, name.length + 1) == name + '='
          cookieValue = decodeURIComponent(cookie.substring(name.length + 1))
          break
        i++
    return cookieValue

  showSegmentation.click ->
    console.log('overlay', tileEditor.previousOverlay, guiParams.overlay);

    #    guiParams.show3DRendition = not guiParams.show3DRendition
    if tileEditor.previousOverlay != null and guiParams.overlay == NO_OVERLAY
      console.log('here');
      guiParams.overlay = tileEditor.previousOverlay
    else
      tileEditor.previousOverlay = guiParams.overlay
      guiParams.overlay = NO_OVERLAY

    console.log('overlay2', tileEditor.previousOverlay, guiParams.overlay);

    changeOverlay(guiParams.overlay)
    updateViewIcon()

  showScribbles.click ->
    guiParams.showScribbles = not guiParams.showScribbles
    updateViewIcon()

  view3DBorder.click ->
    guiParams.overlay = BORDER_MESH_OVERLAY

    changeOverlay(guiParams.overlay)
    updateViewIcon()

  view3DMeshes.click ->
    guiParams.overlay = LABEL_MESH_OVERLAY

    changeOverlay(guiParams.overlay)
    updateViewIcon()

  view2DBorder.click ->
    guiParams.overlay = BORDER_OVERLAY

    changeOverlay(guiParams.overlay)
    updateViewIcon()

  view2DLabel.click ->
    guiParams.overlay = LABEL_OVERLAY

    changeOverlay(guiParams.overlay)
    updateViewIcon()


  fixateClippingPlane.click ->
    guiParams.fixateClippingPlane = not guiParams.fixateClippingPlane;
    updateViewIcon()

  setClippingPlaneXY.click ->
    guiParams.fixateClippingPlane = false;
    coseGUI.changeOrthogonalCameraView(XY_PLANE);
    guiParams.fixateClippingPlane = true;
    updateViewIcon()

  setClippingPlaneZX.click ->
    guiParams.fixateClippingPlane = false;
    coseGUI.changeOrthogonalCameraView(XZ_PLANE);
    guiParams.fixateClippingPlane = true;
    updateViewIcon()

  setClippingPlaneYZ.click ->
    guiParams.fixateClippingPlane = false;
    coseGUI.changeOrthogonalCameraView(YZ_PLANE);
    guiParams.fixateClippingPlane = true;
    updateViewIcon()

  setupWatershedTool = ->
    updateToolIcon()

  selectAddTool.click ->
    guiParams.operations = SCRIBBLE_MANAGER_MODE_ADD
    scribbleManager.stopModes()
    scribbleManager.setMode(guiParams.operations)
    tileEditor.selectedTool = selectAddTool
    updateToolIcon()

  selectDelTool.click ->
    guiParams.operations = SCRIBBLE_MANAGER_MODE_DEL
    scribbleManager.stopModes()
    scribbleManager.setMode(guiParams.operations)
    tileEditor.selectedTool = selectDelTool
    updateToolIcon()

  selectMergeTool.click ->
    guiParams.operations = SCRIBBLE_MANAGER_MODE_MERGE
    scribbleManager.stopModes()
    scribbleManager.setMode(guiParams.operations)
    tileEditor.selectedTool = selectMergeTool
    updateToolIcon()

  selectSplitTool.click ->
    guiParams.operations = SCRIBBLE_MANAGER_MODE_SPLIT
    scribbleManager.stopModes()
    scribbleManager.setMode(guiParams.operations)
    tileEditor.selectedTool = selectSplitTool
    updateToolIcon()

  selectExtendTool.click ->
    guiParams.operations = SCRIBBLE_MANAGER_MODE_EXTEND
    scribbleManager.stopModes()
    scribbleManager.setMode(guiParams.operations)
    tileEditor.selectedTool = selectExtendTool
    updateToolIcon()

  undoButton.click ->
    undo()

  redoButton.click ->
    redo()

  clearSegmentation.click ->
    resetDelineation()
    clearHandlers()

  setupTileEditor = ->
    setupWatershedTool()
    updateViewIcon()

  showBlock = (block) ->
    loadingBlock.hide()
    blocks =
      'error': errorBlock
      'noAssignments': noAssignmentsBlock
      'session': sessionBlock
    b.hide() for l, b of blocks when l != block
    blocks[block].show()

  updateToolIcon = ->
    toolsButtons = [selectAddTool, selectDelTool, selectSplitTool, selectMergeTool, selectExtendTool]
    for tool in toolsButtons
      tool.removeClass 'icon_button_selected'
    selectedTool = tileEditor.selectedTool
    if selectedTool is null
      selectAddTool.addClass 'icon_button_selected'
    else
      selectedTool.addClass 'icon_button_selected'

  updateViewIcon = ->

    if not optimize_for_mobile
      viewButtons = [view2DBorder, view2DLabel, view3DBorder, view3DMeshes, showScribbles, showSegmentation]
      view2DBorder.show()
      view2DLabel.show()
    else
      view2DBorder.hide()
      view2DLabel.hide()
      viewButtons = [view3DBorder, view3DMeshes, showScribbles, showSegmentation]

    for view in viewButtons
      view.removeClass 'icon_button_selected'

    if guiParams.overlay == BORDER_MESH_OVERLAY
      view3DBorder.addClass 'icon_button_selected'
    else if guiParams.overlay == LABEL_MESH_OVERLAY
      view3DMeshes.addClass 'icon_button_selected'
    else if guiParams.overlay == BORDER_OVERLAY
      view2DBorder.addClass 'icon_button_selected'
    else if guiParams.overlay == LABEL_OVERLAY
      view2DLabel.addClass 'icon_button_selected'


    if guiParams.showScribbles
      showScribbles.addClass 'icon_button_selected'

    if guiParams.overlay != NO_OVERLAY
      showSegmentation.addClass 'icon_button_selected'

    if guiParams.fixateClippingPlane
      fixateClippingPlane.addClass 'icon_button_selected'
    else
      fixateClippingPlane.removeClass 'icon_button_selected'


  $(@).ajaxStart ->
    loadingBlock.show()

    currCsrfToken = getCookie('csrftoken')
    currSessionId = undefined

    sessionBlock.children().disable()

    initWebGL()

    initCose3D()

    animate()

  #    tileEditor?.setEnabled no


#  updateWorkerStats = (data) ->
#    workerStats.show()
#
#    #workerScore.html('Score: ' + data['score'])
#
#    position = 0
#    if data['position']?
#      position = data['position']
#    else
#      position = "Couldn't load your position"
#
#    #workerRanking.html('Position: ' + position)
#
#    workerScore.html(data['score'] + ' points')

  onSessionLoadingDone = (data) ->
#    if not currCsrfToken?
#      onSessionLoadingFail()
#      return

    if not data.sessionId?
      showBlock 'noAssignments'
      return

    currSessionId = data.sessionId
    assignmentId.text data.assignmentId

    setupTileEditor()

    info =
      key: 'image',
      filename: data.tileUrl
      xsize: data.tile_xsize
      ysize: data.tile_ysize
      zsize: data.tile_zsize
      context_border: data.tileBorder
      label: if data.preSegUrl? then data.preSegUrl else undefined
      grad:  if data.gradUrl? then data.gradUrl else undefined
      seeds: if data.initialSeedsUrl? then data.initialSeedsUrl else undefined

    $('#container').empty()

    createAvailableImagesFromInfo(info.key)

    loadImage(info)
    curKey = info.key

    showBlock('session')


#    tileEditor.loadTileAsync data.tileUrl, data.tileBorder, (->
##        tileEditor.setEnabled yes
##
##        succeeded = tileEditor.setupSelectedTool(data.preprocessData)
##
##        if (!succeeded)
##          return showBlock 'error'
#
##        if data.preSegUrl?
##          strokeTool.loadStrokes data.preSegUrl
#        sessionBlock.children().enable()
##        updateUndoRedoControls()
##        updateZoomControls()
#        showBlock 'session'),
#      onSessionLoadingFail

  onSessionLoadingFail = ->
    currSessionId = undefined
    currCsrfToken = undefined
    console.log 'Error'
    showBlock 'error'

  updateSession = (action = 'save') ->
    currentImageIdx++;

    initWebGL()

    initCose3D()

    animate()

    #    console.log('Here now', imgInfo, currentImageIdx)
    if(currentImageIdx < imgInfo.images.length)
      data =
        sessionId: 0
        assignmentId: 0
        tileUrl: imgInfo.images[currentImageIdx].filename
        tile_xsize: imgInfo.images[currentImageIdx].xsize
        tile_ysize: imgInfo.images[currentImageIdx].ysize
        tile_zsize: imgInfo.images[currentImageIdx].zsize
        tile_border: if imgInfo.images[currentImageIdx].border? then imgInfo.images[currentImageIdx].border else 0
        preSegUrl: if imgInfo.images[currentImageIdx].label? then imgInfo.images[currentImageIdx].label else undefined
        gradUrl: if imgInfo.images[currentImageIdx].grad? then imgInfo.images[currentImageIdx].grad else undefined
        initialSeedsUrl: if imgInfo.images[currentImageIdx].seeds? then imgInfo.images[currentImageIdx].seeds else undefined

      onSessionLoadingDone(data)
    else
      onSessionLoadingFail()

#    $.ajax(
#      url: '/crowd/workers/session'
#      headers:
#        'X-CSRFToken': currCsrfToken,
#        'sessionId': currSessionId
#      type: if action is 'retrieve' then 'GET' else 'POST',
#      contentType: 'application/octet-stream'
#      data: if action is 'save' then currentImage.getLabelInOriginalSize().val else null,
#      processData: false)
#      .done(onSessionLoadingDone)
#      .fail(onSessionLoadingFail)


  setupSessionCtrls = ->
    confirmationBlocks.dialog
      autoOpen: no
      resizable: no
      modal: yes
      open: -> $(@).parent().find('button:last-child').focus()
      buttons:
        'Confirm': -> updateSession $(@).dialog('close').data 'action'
        Cancel: -> $(@).dialog 'close'

    skipAssignment.click -> skipConfirmationBlock.dialog 'open'

    saveAssignment.click -> saveConfirmationBlock.dialog 'open'

#  updateRank = -> $.ajax('/crowd/workers/rank/10',
#    success: (data) ->
#      noRankingBlock.hide()
#      rankingBlock.show()
#      if data?
#        html_code = "
#          <tr>
#            <th colspan='2' style='padding: 0px 50px 10px 0px'>Coser</th>
#            <th style='text-align: right; padding: 0px 0px 0px 0px'>Points</th>
#            <th style='text-align: right; padding: 0px 0px 0px 0px'>Miles</th>
#            <th style='text-align: right; padding: 0px 0px 0px 0px'>Precision</th>
#          </tr>"
#        for el in data
#          html_code = html_code + "<tr>"
#          html_code = html_code + "<td style='text-align: right'>" + el[2] + "</td>"
#          html_code = html_code + "<td style='text-align: left; padding: 0px 15px 0px 8px'>" + el[0] + "</td>"
#          html_code = html_code + "<td style='text-align: right; padding: 0px 0px 0px 30px''>" + el[1] + "</td>"
#          html_code = html_code + "<td style='text-align: right; padding: 0px 0px 0px 30px''>" + el[3] + "</td>"
#          html_code = html_code + "<td style='text-align: right; padding: 0px 0px 0px 30px''>" + el[4] + "</td>"
#          html_code = html_code + "<tr>"
#
#        rank.html(html_code)
#      else
#        rankingBlock.hide()
#        noRankingBlock.show()
#
#    error: ->
#      rankingBlock.empty()
#      rankingBlock.hide()
#    global: false
#  )

#  updateStats = ->
#    $.ajax(
#      url: '/profiles/workers/my_stats'
#      success: updateWorkerStats,
#      error: ->
#        workerStats.hide()
#        workerStats.empty()
#      global: false
#    )

  setupSessionCtrls()

  loadImageInfo(updateSession)

#  updateSession 'retrieve'

#  updateStats()
#  updateRank()
#
#  setInterval updateStats, 5000
#  setInterval updateRank, 3000