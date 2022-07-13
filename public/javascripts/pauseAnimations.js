/*
a Pen by DIACO : twitter.com/Diaco_ml || codepen.io/MAW
powered by GSAP : https://www.greensock.com/
*/

import {gsap, TweenLite, ScrollTrigger, Draggable, Flip, MotionPathPlugin } from "../gsap/all.js";

var MOUSE_X;
var MOUSE_Y;

document.addEventListener("DOMContentLoaded", () => {
    document.addEventListener("mousemove", function(e) {
        MOUSE_X = e.clientX;
        MOUSE_Y = e.clientY;
    });

    
    document.addEventListener("mouseleave", function(e) {
        MOUSE_X = undefined;
        MOUSE_Y = undefined;
    });

    // don't forget to register plugins
    gsap.registerPlugin(ScrollTrigger, Draggable, Flip, MotionPathPlugin); 

    var total = 20;
    var container = document.getElementById('app');
    var w = window.innerWidth;
    var h = window.innerHeight;
    var fireflies = [];

    for (var i=total;i--;){ 
        let newFirefly = document.createElement('div');
        newFirefly.classList.add("dot");
        container.appendChild(newFirefly);
        fireflies.push(newFirefly);

        gsap.set(newFirefly, {
            x: R(w),
            y: R(h),
            opacity: 0
        });

        MoveAnim(newFirefly);
        GlowAnim(newFirefly, oneOrZero());
    };

    function MoveAnim(newFirefly) {
        var thisMotion;
        if (R(10) > 3 && MOUSE_X != 0 && MOUSE_X != undefined){
            thisMotion = [{x:MOUSE_X,y:MOUSE_Y},{x:R(w),y:R(h)}];
        } else {
            thisMotion = [{x:R(w),y:R(h)},{x:R(w),y:R(h)}];
        }

        gsap.to(newFirefly, {
            motionPath: thisMotion,
            duration: R(10)+10,
            scale: R(1.2)+0.2,
            onComplete: MoveAnim,
            onCompleteParams: [newFirefly]
        });
    }

    function GlowAnim(newFirefly, lastOpacity) {
        var thisDelay = 0;
        if (lastOpacity == 1){ thisDelay = R(7); }
        gsap.to(newFirefly, {
            duration: 1.0,
            opacity: lastOpacity,
            delay: thisDelay,
            onComplete: GlowAnim,
            onCompleteParams: [newFirefly, 1-lastOpacity]
        });
    }
});

function R(max){return Math.random()*max};
function oneOrZero(){ return Math.floor(Math.random()*2); };