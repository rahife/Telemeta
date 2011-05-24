/*
 * Copyright (C) 2007-2011 Parisson
 * Copyright (c) 2011 Riccardo Zaccarelli <riccardo.zaccarelli@gmail.com>
 * Copyright (c) 2010 Olivier Guilyardi <olivier@samalyse.com>
 *
 * This file is part of TimeSide.
 *
 * TimeSide is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * TimeSide is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with TimeSide.  If not, see <http://www.gnu.org/licenses/>.
 *
 * Authors: Riccardo Zaccarelli <riccardo.zaccarelli@gmail.com>
 *          Olivier Guilyardi <olivier@samalyse.com>
 */

/**
 * Class representing the ruler (upper part) of the player. Requires jQuery
 * wz_jsgraphics.
 */
var Ruler = TimesideArray.extend({
    //init constructor: soundDuration is IN SECONDS!!! (float)
    init: function(viewer, soundDuration){
        this._super();
        var cssPref = this.cssPrefix;
        
       
        this.getSoundDuration= function(){
            return soundDuration;
        };
        
        var waveContainer = viewer.find('.' + cssPref + 'image-canvas');
        this.debug( 'WAVECONTAINER?? LENGTH='+ waveContainer.length);
        this.getWaveContainer =function(){
            return waveContainer;
        };
        //ts-image-canvas has width=0. Why was not the case in old code?
        //BECAUSE IN OLD CODE ts-image-canvas has style="width..height" defined, and not HERE!!!!
        this.getContainerWidth =function(){
            return waveContainer.width();
        };
        
        
        this.debug( 'init ruler: container width '+this.getContainerWidth());
        
        
        //private function used in resize() defined below
        

        var container = viewer.find('.' + cssPref + 'ruler');
        
        this.getRulerContainer = function(){
            return container;
        }
    },

    resize : function(){
        //code copied from old implementation, still to get completely what is going on here...
        var sectionSteps = [[5, 1], [10, 1], [20, 2], [30, 5], [60, 10], [120, 20], [300, 30],
        [600, 60], [1800, 300], [3600, 600]];
        //old computeLayout code
        var fullSectionDuration,sectionSubDivision, sectionsNum;
        var width = this.getContainerWidth();
        var duration = this.getSoundDuration();
        var cssPref = this.cssPrefix;//defined in superclass
        var fontSize = 10;
        var mfloor = Math.floor; //instanciating once increases performances
        var $J = this.$J; //reference to jQuery
        //this.debug('container width: ' +" "+width);


        var i, ii = sectionSteps.length;
        var timeLabelWidth = this.textWidth('00:00', fontSize);
        for (i = 0; i < ii; i++) {
            var tempDuration = sectionSteps[i][0];
            var subDivision = sectionSteps[i][1];
            var labelsNum = mfloor(duration / tempDuration);
            if ((i == ii - 1) || (width / labelsNum > timeLabelWidth * 2)) {
                fullSectionDuration = tempDuration;
                sectionSubDivision = subDivision;
                sectionsNum = mfloor(duration / fullSectionDuration);
                //this.debug('(in _computeLayout) this.fullSectionDuration: ' + fullSectionDuration);
                //this.debug('(in _computeLayout) sectionsNum: ' +sectionsNum);
                //this.debug('(in _computeLayout) sectionSubDivision: ' +sectionSubDivision);
                break;
            }
        }
        //old draw() code:
        if (!duration) {
            this.debug("Can't draw ruler with a duration of 0");
            return;
        }
        //this.debug("draw ruler, duration: " + duration);

        var container = this.getRulerContainer();
        var layout = container.find("."+cssPref + 'layout');
        //REDONE: if does not exists, create it
        if(!layout || !(layout.length)){
            layout = $J('<div/>')
            .addClass(cssPref + 'layout')
            .css({
                position: 'relative'
            }) // bugs on IE when resizing
            //TODO: bind doubleclick events!!!!!!
            //.bind('dblclick', this.attachWithEvent(this._onDoubleClick))
            //.bind('resize', this.attachWithEvent(this.resize)) // Can loop ?
            .appendTo(container);
        }else{
            //remove all elements neither pointer (or children of it) nor marker (or children of it)
            layout.find(':not(a.ts-pointer,a.ts-marker,a.ts-pointer>*,a.ts-marker>*)').remove();
        }

        //        if (layout && layout.length){
        //            layout.remove();
        //        }
        //        layout = $J('<div/>')
        //        .addClass(cssPref + 'layout')
        //        .css({
        //            position: 'relative'
        //        }) // bugs on IE when resizing
        //        //TODO: bind doubleclick events!!!!!!
        //        //.bind('dblclick', this.attachWithEvent(this._onDoubleClick))
        //        //.bind('resize', this.attachWithEvent(this.resize)) // Can loop ?
        //        .appendTo(container);

        

        //creating sections
        //defining function maketimelabel
        var makeTimeLabel = this.makeTimeLabel;
            
        //defining the function createSection
        var _createSection = function(timeOffset, pixelWidth,timeLabelWidth) {
            var section = $J('<div/>')
            .addClass(cssPref + 'section')
            .css({
                fontSize: fontSize + 'px',
                fontFamily: 'monospace',
                width: pixelWidth,
                overflow: 'hidden'
            })
            .append($J('<div />').addClass(cssPref + 'canvas'));

            var topDiv = $J('<div/>')
            .addClass(cssPref + 'label')
            .appendTo(section);
            var bottomDiv = $J('<div/>')
            .addClass(cssPref + 'lines')
                
            .appendTo(section);
            var empty = $J('<span/>').css({
                visibility: 'hidden'
            }).text('&nbsp;');
            var text;

            if (pixelWidth > timeLabelWidth) {
                text = $J('<span/>')
                .text(makeTimeLabel(timeOffset))
                .bind('mousedown selectstart', function() { //WHY THIS?
                    return false;
                });
            } else {
                text = empty.clone();
            }
            topDiv.append(text);
            bottomDiv.append(empty);
            return section;
        };
        //function defined, creating sections:
        var sections = new Array();
        var currentWidth = 0;
        var sectionDuration, sectionWidth;
        for (i = 0; i <= sectionsNum; i++) {
            if (i < sectionsNum) {
                sectionDuration = fullSectionDuration;
                sectionWidth = mfloor(sectionDuration / duration * width);
            } else {
                sectionDuration = duration - i * fullSectionDuration;
                sectionWidth = width - currentWidth;

            }
            var section = _createSection(i * fullSectionDuration, sectionWidth, timeLabelWidth);
            if (i > 0) {
                section.css({
                    left: currentWidth,
                    top: 0,
                    position: 'absolute'
                });
            }
            section.duration = sectionDuration;
            layout.append(section);
            currentWidth += section.width();
            sections[i] = section;
        }

        //function to draw section rulers:
        var _drawSectionRuler= function(section, drawFirstMark) {
            var j;
               
            var jg = new jsGraphics(section.find('.' + cssPref + 'canvas').get(0));
            jg.setColor(layout.find('.' + cssPref + 'lines').css('color'));
            var height = section.height();
            var ypos;
            for (j = 0; j < section.duration; j += sectionSubDivision) {
                if (j == 0) {
                    if (drawFirstMark) {
                        ypos = 0;
                    } else {
                        continue;
                    }
                } else {
                    ypos = (j == section.duration / 2) ? 1/2 + 1/8 : 3/4;
                }
                //var x = j / this.duration * this.width;
                var x = j / duration * width;
                jg.drawLine(x, height * ypos, x, height - 1);
            }
            jg.paint();
        };
        //draw section rulers
        for (i = 0; i <= sectionsNum; i++) {
            _drawSectionRuler(sections[i], (i > 0));
        }

       
        var pointer = undefined;
        if('getPointer' in this){
            pointer = this.getPointer();
        }
        if(!pointer){
            pointer = this.add(0);
            this.getPointer = function(){
                return pointer;
            };
        }else{
            pointer.refreshPosition();
            
        }
        this.each(function(i,rulermarker){
            rulermarker.refreshPosition();
        });

    },

    //overridden: Note that the pointer is NOT cleared!!!!!
    clear: function(){
        var markers = this._super();
        //        if('getPointer' in this){
        //            markers.push(this.getPointer());
        //        }
        for( var i=0; i<markers.length; i++){
            markers[i].remove();
        }
        return markers;
    },
    //overridden TimesideArray methods (add, move, remove):
    remove: function(index){
        var rulermarker = this._super(index);
        rulermarker.remove();
        this.each(index, function(i,rulermarker){
            rulermarker.setIndex(i, true);
        });
    },
    //overridden
    move: function(from, to){
        var newIndex = this._super(from,to);
        //this.debug('ruler.move: [from:'+from+', to:'+to+', real:'+newIndex+']');
        if(newIndex!=from){
            var i1 = Math.min(from,newIndex);
            var i2 = Math.max(from,newIndex)+1;
            //this.debug('updating ['+i1+','+i2+']');
            this.each(i1,i2, function(index,rulermarker){
                rulermarker.setIndex(index, true);
            });
        }
    },
    //overridden
    //markerObjOrOffset can be a marker object (see in markermap) or any object with the fields isEditable and offset
    add: function(markerObjOrOffset, indexIfMarker){
        var soundPosition;
        var isMovable;
        var markerClass;

        if(typeof markerObjOrOffset == 'number'){
            soundPosition = markerObjOrOffset;
            isMovable = true;
            markerClass='pointer';
        }else{
            soundPosition = markerObjOrOffset.offset;
            isMovable = markerObjOrOffset.isEditable;
            markerClass='marker';
        }
        
        var container = this.getRulerContainer();
        var layout = container.find("."+this.cssPrefix + 'layout');
        var $J = this.$J;
        var pointer = new RulerMarker($J(layout.get(0)),this.getWaveContainer(),markerClass);
        //call super constructor
        //if it is a pointer, dont add it
        if(markerClass != 'pointer'){
            this._super(pointer,indexIfMarker); //add at the end
            //note that setText is called BEFORE move as move must have the proper label width
            this.each(indexIfMarker, function(i,rulermarker){
                rulermarker.setIndex(i,i!=indexIfMarker);
            //rulermarker.setIndex.apply(rulermarker, [i,i!=indexIfMarker]); //update label width only if it is not this marker added
            //as for this marker we update the position below (move)
            });
            this.debug('added marker at index '+indexIfMarker+' offset: '+markerObjOrOffset.offset);
        }else{
            //note that setText is called BEFORE move as move must have the proper label width
            pointer.setText(this.makeTimeLabel(0));
        }
        //proceed with events and other stuff: move (called AFTER setText or setText)
        pointer.move(this.toPixelOffset(soundPosition));
       
        //pointer.setText(markerClass== 'pointer' ? this.makeTimeLabel(0) : this.length);

        //click on labels stop propagating. Always:
        var lbl = pointer.getLabel();
        lbl.bind('click', function(evt){
            evt.stopPropagation();
            return false;
        });

        //if there are no events to associate, return it.
        if(!isMovable){
            return pointer;
        }

        //namespace for jquery event:
        var eventId = 'markerclicked';
        var doc = $J(document);
        
        var me = this;

        //flag to be set to true when moving a poiner from mouse.
        //when true, movePointer (see below) has no effect
        this.isPointerMovingFromMouse = false;
        //functions to set if we are moving the pointer (for player when playing)

        lbl.bind('mousedown.'+eventId,function(evt) {
            
            if(markerClass=='pointer'){
                me.isPointerMovingFromMouse = true;
            }

            var startX = evt.pageX; //lbl.position().left-container.position().left;
            var startPos = lbl.position().left+lbl.width()/2;
            
            evt.stopPropagation(); //dont notify the ruler or other elements;
            var newPos = startPos;
            doc.bind('mousemove.'+eventId, function(evt){
                var x = evt.pageX; 
                newPos = startPos+(x-startX);
                pointer.move(newPos);
                //update the text if pointer
                if(markerClass=='pointer'){
                    pointer.setText(me.makeTimeLabel(me.toSoundPosition(newPos)));
                }
                return false;
                
            });
            //to avoid scrolling
            //TODO: what happens if the user releases the mouse OUTSIDE the browser????
            var mouseup = function(evt_){
                doc.unbind('mousemove.'+eventId);
                doc.unbind('mouseup.'+eventId);
                evt_.stopPropagation();
                if(newPos == startPos){
                    return false;
                }
                var data = {
                    'markerElement':pointer,
                    'soundPosition': me.toSoundPosition.apply(me,[newPos]),
                    'markerClass':markerClass
                };
                me.fire('markermoved',data);
                if(markerClass=='pointer'){
                    me.isPointerMovingFromMouse = false;
                }
                return false;
            };
            doc.bind('mouseup.'+eventId, mouseup);
            
            return false;
        });
        
        return pointer;


    },

    //moves the pointer, does not notify any listener.
    //soundPosition is in seconds (float)
    movePointer : function(soundPosition) {
        var pointer = this.getPointer();
        if (pointer && !this.isPointerMovingFromMouse) {
            var pixelOffset = this.toPixelOffset(soundPosition);
            //first set text, so the label width is set, then call move:
            pointer.setText(this.makeTimeLabel(soundPosition));
            pointer.move(pixelOffset); //does NOT fire any move method
        }
        //this.debug('moving pointer: position set to '+offset);
        return soundPosition;
    },

    //soundPosition is in seconds (float)
    toPixelOffset: function(soundPosition) {
        //this.debug('sPos:' + soundPosition+ 'sDur: '+this.getSoundDuration());
        var duration = this.getSoundDuration();
        if (soundPosition < 0){
            soundPosition = 0;
        }else if (soundPosition > duration){
            soundPosition = duration;
        }
        var width = this.getContainerWidth();
        var pixelOffset = (soundPosition / duration) * width;
        return pixelOffset;
    },

    //returns the soundPosition is in seconds (float)
    toSoundPosition: function(pixelOffset) {
        var width = this.getContainerWidth();

        if (pixelOffset < 0){
            pixelOffset = 0;
        }else if (pixelOffset > width){
            pixelOffset = width;
        }
        var duration = this.getSoundDuration();
        var soundPosition = (pixelOffset / width) *duration;
        return soundPosition;
    }
});