import{g as Fi,S as ls}from"./vendor-gsap.Bze3xGb8.js";import{w as io}from"./page-loader-controller.BBaw2QI8.js";const us=`
precision highp float;
in vec3 position;
void main() {
    gl_Position = vec4(position, 1.0);
}
`,ro=`
precision highp float;
attribute vec3 position;
void main() {
    gl_Position = vec4(position, 1.0);
}
`,hs=`
precision highp float;
uniform vec2 offset;
uniform vec2 resolution;
uniform sampler2D src;
out vec4 outColor;
void main() {
    vec2 uv = (gl_FragCoord.xy - offset) / resolution;
    if (uv.x < 0. || uv.x > 1. || uv.y < 0. || uv.y > 1.) {
        discard;
    }
    outColor = texture(src, uv);
}
`,O=`precision highp float;
uniform vec2 resolution;
uniform vec2 offset;
uniform float time;
uniform bool autoCrop;
uniform sampler2D src;
out vec4 outColor;
`,D=`vec4 readTex(sampler2D tex, vec2 uv) {
    if (autoCrop && (uv.x < 0. || uv.x > 1. || uv.y < 0. || uv.y > 1.)) {
        return vec4(0);
    }
    return texture(tex, uv);
}`,Wr={none:hs,uvGradient:`
    ${O}
    ${D}

    void main() {
        vec2 uv = (gl_FragCoord.xy - offset) / resolution;
        outColor = vec4(uv, sin(time) * .5 + .5, 1);

        vec4 img = readTex(src, uv);
        outColor *= smoothstep(0., 1., img.a);
    }
    `,rainbow:`
    ${O}
    ${D}

    vec3 hsv2rgb(vec3 c) {
        vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
        vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
        return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
    }

    vec3 rgb2hsv(vec3 c) {
        vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
        vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
        vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));

        float d = q.x - min(q.w, q.y);
        float e = 1.0e-10;
        return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
    }

    vec3 hueShift(vec3 rgb, float t) {
        vec3 hsv = rgb2hsv(rgb);
        hsv.x = fract(hsv.x + t);
        return hsv2rgb(hsv);
    }

    void main() {
        vec2 uv = (gl_FragCoord.xy - offset) / resolution;
        vec2 uv2 = uv;
        uv2.x *= resolution.x / resolution.y;

        float x = (uv2.x - uv2.y) - fract(time);

        vec4 img = readTex(src, uv);
        float gray = length(img.rgb);

        img.rgb = vec3(hueShift(vec3(1,0,0), x) * gray);

        outColor = img;
    }
    `,glitch:`
    ${O}
    ${D}

    float nn(float y, float t) {
        float n = (
            sin(y * .07 + t * 8. + sin(y * .5 + t * 10.)) +
            sin(y * .7 + t * 2. + sin(y * .3 + t * 8.)) * .7 +
            sin(y * 1.1 + t * 2.8) * .4
        );

        n += sin(y * 124. + t * 100.7) * sin(y * 877. - t * 38.8) * .3;

        return n;
    }

    void main (void) {
        vec2 uv = (gl_FragCoord.xy - offset) / resolution;
        vec4 color = readTex(src, uv);

        float t = mod(time, 3.14 * 10.);

        // Seed value
        float v = fract(sin(t * 2.) * 700.);

        if (abs(nn(uv.y, t)) < 1.2) {
            v *= 0.01;
        }

        // Prepare for chromatic Abbreveation
        vec2 focus = vec2(0.5);
        float d = v * 0.6;
        vec2 ruv = focus + (uv - focus) * (1. - d);
        vec2 guv = focus + (uv - focus) * (1. - 2. * d);
        vec2 buv = focus + (uv - focus) * (1. - 3. * d);

        // Random Glitch
        if (v > 0.1) {
            // Randomize y
            float y = floor(uv.y * 13. * sin(35. * t)) + 1.;
            if (sin(36. * y * v) > 0.9) {
                ruv.x = uv.x + sin(76. * y) * 0.1;
                guv.x = uv.x + sin(34. * y) * 0.1;
                buv.x = uv.x + sin(59. * y) * 0.1;
            }

            // RGB Shift
            v = pow(v * 1.5, 2.) * 0.15;
            color.rgb *= 0.3;
            color.r += readTex(src, vec2(uv.x + sin(t * 123.45) * v, uv.y)).r;
            color.g += readTex(src, vec2(uv.x + sin(t * 157.67) * v, uv.y)).g;
            color.b += readTex(src, vec2(uv.x + sin(t * 143.67) * v, uv.y)).b;
        }

        // Compose Chromatic Abbreveation
        if (abs(nn(uv.y, t)) > 1.1) {
            color.r = color.r * 0.5 + color.r * texture(src, ruv).r;
            color.g = color.g * 0.5 + color.g * texture(src, guv).g;
            color.b = color.b * 0.5 + color.b * texture(src, buv).b;
            color *= 2.;
        }

        outColor = color;
        outColor.a = smoothstep(0.0, 0.8, max(color.r, max(color.g, color.b)));
    }
    `,pixelate:`
    ${O}
    ${D}

    void main (void) {
        vec2 uv = (gl_FragCoord.xy - offset) / resolution;

        float b = sin(time * 2.) * 32. + 48.;
        uv = floor(uv * b) / b;
        outColor = readTex(src, uv);
    }
    `,rgbGlitch:`
    ${O}
    ${D}

    float random(vec2 st) {
        return fract(sin(dot(st, vec2(948.,824.))) * 30284.);
    }

    void main (void) {
        vec2 uv = (gl_FragCoord.xy - offset) / resolution;
        vec2 uvr = uv, uvg = uv, uvb = uv;

        float tt = mod(time, 17.);

        if (fract(tt * 0.73) > .8 || fract(tt * 0.91) > .8) {
            float t = floor(tt * 11.);

            float n = random(vec2(t, floor(uv.y * 17.7)));
            if (n > .7) {
                uvr.x += random(vec2(t, 1.)) * .1 - 0.05;
                uvg.x += random(vec2(t, 2.)) * .1 - 0.05;
                uvb.x += random(vec2(t, 3.)) * .1 - 0.05;
            }

            float ny = random(vec2(t * 17. + floor(uv * 19.7)));
            if (ny > .7) {
                uvr.x += random(vec2(t, 4.)) * .1 - 0.05;
                uvg.x += random(vec2(t, 5.)) * .1 - 0.05;
                uvb.x += random(vec2(t, 6.)) * .1 - 0.05;
            }
        }

        vec4 cr = readTex(src, uvr);
        vec4 cg = readTex(src, uvg);
        vec4 cb = readTex(src, uvb);

        outColor = vec4(
            cr.r,
            cg.g,
            cb.b,
            step(.1, cr.a + cg.a + cb.a)
        );
    }
    `,rgbShift:`
    ${O}
    ${D}

    float nn(float y, float t) {
        float n = (
            sin(y * .07 + t * 8. + sin(y * .5 + t * 10.)) +
            sin(y * .7 + t * 2. + sin(y * .3 + t * 8.)) * .7 +
            sin(y * 1.1 + t * 2.8) * .4
        );

        n += sin(y * 124. + t * 100.7) * sin(y * 877. - t * 38.8) * .3;

        return n;
    }

    float step2(float t, vec2 uv) {
        return step(t, uv.x) * step(t, uv.y);
    }

    void main (void) {
        vec2 uv = (gl_FragCoord.xy - offset) / resolution;
        vec2 uvr = uv, uvg = uv, uvb = uv;

        float t = mod(time, 30.);

        float amp = 10. / resolution.x;

        if (abs(nn(uv.y, t)) > 1.) {
            uvr.x += nn(uv.y, t) * amp;
            uvg.x += nn(uv.y, t + 10.) * amp;
            uvb.x += nn(uv.y, t + 20.) * amp;
        }

        vec4 cr = readTex(src, uvr);
        vec4 cg = readTex(src, uvg);
        vec4 cb = readTex(src, uvb);

        outColor = vec4(
            cr.r,
            cg.g,
            cb.b,
            smoothstep(.0, 1., cr.a + cg.a + cb.a)
        );
    }
    `,halftone:`
    // Halftone Effect by zoidberg
    // https://www.interactiveshaderformat.com/sketches/234

    ${O}
    ${D}

    // TODO: uniform
    #define gridSize 10.0
    #define dotSize 0.7
    #define smoothing 0.15
    #define speed 1.0

    #define IMG_PIXEL(x, y) readTex(x, (y - offset) / resolution);

    vec4 gridRot = vec4(15.0, 45.0, 75.0, 0.0);

    // during calculation we find the closest dot to a frag, determine its size, and then determine the size of the four dots above/below/right/left of it. this array of offsets move "one left", "one up", "one right", and "one down"...
    vec2 originOffsets[4];

    void main() {
        vec2 fragCoord = gl_FragCoord.xy - offset;

        // a halftone is an overlapping series of grids of dots
        // each grid of dots is rotated by a different amount
        // the size of the dots determines the colors. the shape of the dot should never change (always be a dot with regular edges)
        originOffsets[0] = vec2(-1.0, 0.0);
        originOffsets[1] = vec2(0.0, 1.0);
        originOffsets[2] = vec2(1.0, 0.0);
        originOffsets[3] = vec2(0.0, -1.0);

        vec3 rgbAmounts = vec3(0.0);

        // for each of the channels (i) of RGB...
        for (float i=0.0; i<3.0; ++i) {
            // figure out the rotation of the grid in radians
            float rotRad = radians(gridRot[int(i)]);

            // the grids are rotated counter-clockwise- to find the nearest dot, take the fragment pixel loc,
            // rotate it clockwise, and split by the grid to find the center of the dot. then rotate this
            // coord counter-clockwise to yield the location of the center of the dot in pixel coords local to the render space
            mat2 ccTrans = mat2(vec2(cos(rotRad), sin(rotRad)), vec2(-1.0*sin(rotRad), cos(rotRad)));
            mat2 cTrans = mat2(vec2(cos(rotRad), -1.0*sin(rotRad)), vec2(sin(rotRad), cos(rotRad)));

            // find the location of the frag in the grid (prior to rotating it)
            vec2 gridFragLoc = cTrans * fragCoord.xy;

            // find the center of the dot closest to the frag- there's no "round" in GLSL 1.2, so do a "floor" to find the dot to the bottom-left of the frag, then figure out if the frag would be in the top and right halves of that square to find the closest dot to the frag
            vec2 gridOriginLoc = vec2(floor(gridFragLoc.x/gridSize), floor(gridFragLoc.y/gridSize));

            vec2 tmpGridCoords = gridFragLoc/vec2(gridSize);
            bool fragAtTopOfGrid = ((tmpGridCoords.y-floor(tmpGridCoords.y)) > (gridSize/2.0)) ? true : false;
            bool fragAtRightOfGrid = ((tmpGridCoords.x-floor(tmpGridCoords.x)) > (gridSize/2.0)) ? true : false;
            if (fragAtTopOfGrid)
                gridOriginLoc.y = gridOriginLoc.y + 1.0;
            if (fragAtRightOfGrid)
                gridOriginLoc.x = gridOriginLoc.x + 1.0;

            // ...at this point, "gridOriginLoc" contains the grid coords of the nearest dot to the fragment being rendered
            // convert the location of the center of the dot from grid coords to pixel coords
            vec2 gridDotLoc = vec2(gridOriginLoc.x*gridSize, gridOriginLoc.y*gridSize) + vec2(gridSize/2.0);

            // rotate the pixel coords of the center of the dot so they become relative to the rendering space
            vec2 renderDotLoc = ccTrans * gridDotLoc;

            // get the color of the pixel of the input image under this dot (the color will ultimately determine the size of the dot)
            vec4 renderDotImageColorRGB = IMG_PIXEL(src, renderDotLoc + offset);

            // the amount of this channel is taken from the same channel of the color of the pixel of the input image under this halftone dot
            float imageChannelAmount = renderDotImageColorRGB[int(i)];

            // the size of the dot is determined by the value of the channel
            float dotRadius = imageChannelAmount * (gridSize * dotSize);
            float fragDistanceToDotCenter = distance(fragCoord.xy, renderDotLoc);
            if (fragDistanceToDotCenter < dotRadius) {
                rgbAmounts[int(i)] += smoothstep(dotRadius, dotRadius-(dotRadius*smoothing), fragDistanceToDotCenter);
            }

            // calcluate the size of the dots abov/below/to the left/right to see if they're overlapping
            for (float j=0.0; j<4.0; ++j) {
                gridDotLoc = vec2((gridOriginLoc.x+originOffsets[int(j)].x)*gridSize, (gridOriginLoc.y+originOffsets[int(j)].y)*gridSize) + vec2(gridSize/2.0);

                renderDotLoc = ccTrans * gridDotLoc;
                renderDotImageColorRGB = IMG_PIXEL(src, renderDotLoc + offset);

                imageChannelAmount = renderDotImageColorRGB[int(i)];
                dotRadius = imageChannelAmount * (gridSize*1.50/2.0);
                fragDistanceToDotCenter = distance(fragCoord.xy, renderDotLoc);
                if (fragDistanceToDotCenter < dotRadius) {
                    rgbAmounts[int(i)] += smoothstep(dotRadius, dotRadius-(dotRadius*smoothing), fragDistanceToDotCenter);
                }
            }
        }

        vec2 uv = (gl_FragCoord.xy - offset) / resolution;
        vec4 original = readTex(src, uv);
        float alpha = step(.1, rgbAmounts[0] + rgbAmounts[1] + rgbAmounts[2] + original.a);

        outColor = vec4(rgbAmounts[0], rgbAmounts[1], rgbAmounts[2], alpha);
    }
    `,sinewave:`
    ${O}
    ${D}

    vec4 draw(vec2 uv) {
        vec2 uvr = uv, uvg = uv, uvb = uv;

        float amp = 20. / resolution.x;

        uvr.x += sin(uv.y * 7. + time * 3.) * amp;
        uvg.x += sin(uv.y * 7. + time * 3. + .4) * amp;
        uvb.x += sin(uv.y * 7. + time * 3. + .8) * amp;

        vec4 cr = readTex(src, uvr);
        vec4 cg = readTex(src, uvg);
        vec4 cb = readTex(src, uvb);

        return vec4(
            cr.r,
            cg.g,
            cb.b,
            cr.a + cg.a + cb.a
        );
    }

    void main (void) {
        vec2 uv = (gl_FragCoord.xy - offset) / resolution;

        // x blur
        vec2 dx = vec2(2, 0) / resolution.x;
        outColor = (draw(uv) * 2. + draw(uv + dx) + draw(uv - dx)) / 4.;
    }
    `,shine:`
    ${O}
    ${D}

    void main (void) {
        vec2 uv = (gl_FragCoord.xy - offset) / resolution;

        vec2 p = uv * 2. - 1.;
        float a = atan(p.y, p.x);

        vec4 col = readTex(src, uv);
        float gray = length(col.rgb);

        float level = 1. + sin(a * 10. + time * 3.) * 0.2;

        outColor = vec4(1, 1, .5, col.a) * level;
    }
    `,blink:`
    ${O}
    ${D}

    void main (void) {
        vec2 uv = (gl_FragCoord.xy - offset) / resolution;

        outColor = readTex(src, uv) * (sin(time * 5.) * 0.2 + 0.8);
    }

    `,spring:`
    ${O}
    ${D}

    void main (void) {
        vec2 uv = (gl_FragCoord.xy - offset) / resolution;
        uv = (uv - .5) * (1.05 + sin(time * 5.) * 0.05) + .5;
        outColor = readTex(src, uv);
    }
    `,duotone:`
    ${O}
    ${D}

    uniform vec4 color1;
    uniform vec4 color2;
    uniform float speed;

    void main (void) {
        vec2 uv = (gl_FragCoord.xy - offset) / resolution;
        vec4 color = readTex(src, uv);

        float gray = dot(color.rgb, vec3(0.2, 0.7, 0.08));
        float t = mod(gray * 2.0 + time * speed, 2.0);

        if (t < 1.) {
            outColor = mix(color1, color2, fract(t));
        } else {
            outColor = mix(color2, color1, fract(t));
        }

        outColor.a *= color.a;
    }
    `,tritone:`
    ${O}
    ${D}

    uniform vec4 color1;
    uniform vec4 color2;
    uniform vec4 color3;
    uniform float speed;

    void main (void) {
        vec2 uv = (gl_FragCoord.xy - offset) / resolution;
        vec4 color = readTex(src, uv);

        float gray = dot(color.rgb, vec3(0.2, 0.7, 0.08));
        float t = mod(gray * 3.0 + time * speed, 3.0);

        if (t < 1.) {
            outColor = mix(color1, color2, fract(t));
        } else if (t < 2.) {
            outColor = mix(color2, color3, fract(t));
        } else {
            outColor = mix(color3, color1, fract(t));
        }

        outColor.a *= color.a;
    }
    `,hueShift:`
    ${O}
    ${D}

    uniform float shift;

    vec3 hsv2rgb(vec3 c) {
        vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
        vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
        return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
    }

    vec3 rgb2hsv(vec3 c) {
        vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
        vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
        vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));

        float d = q.x - min(q.w, q.y);
        float e = 1.0e-10;
        return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
    }

    vec3 hueShift(vec3 rgb, float t) {
        vec3 hsv = rgb2hsv(rgb);
        hsv.x = fract(hsv.x + t);
        return hsv2rgb(hsv);
    }

    void main (void) {
        vec2 uv = (gl_FragCoord.xy - offset) / resolution;
        vec4 color = readTex(src, uv);
        color.rgb = hueShift(color.rgb, shift);
        outColor = color;
    }
    `,warpTransition:`
    ${O}
    uniform float enterTime;
    uniform float leaveTime;

    ${D}

    #define DURATION 1.0

    void main (void) {
        vec2 uv = (gl_FragCoord.xy - offset) / resolution;

        float t1 = enterTime / DURATION;
        float t2 = leaveTime / DURATION;
        float t = clamp(min(t1, 1. - t2), 0., 1.);

        if (t == 0.) {
            discard;
        }

        if (t < 1.) {
            uv.x += sin(floor(uv.y * 300.)) * 3. * exp(t * -10.);
        }

        outColor = readTex(src, uv);
    }
    `,slitScanTransition:`
    ${O}
    ${D}

    uniform float enterTime;
    uniform float leaveTime;

    #define DURATION 1.0

    void main (void) {
        vec2 uv = (gl_FragCoord.xy - offset) / resolution;

        float t1 = enterTime / DURATION;
        float t2 = leaveTime / DURATION;

        // Do not render before enter or after leave
        if (t1 < 0. || 1. < t2) {
            discard;
        }

        if (0. < t2) {
            // Leaving
            float t = 1. - t2;
            uv.y = uv.y < t ? uv.y : t;
        } else if (t1 < 1.) {
            // Entering
            float t = 1. - t1;
            uv.y = uv.y < t ? t : uv.y;
        }

        outColor = readTex(src, uv);
    }
    `,pixelateTransition:`
    ${O}
    ${D}

    uniform float enterTime;
    uniform float leaveTime;

    #define DURATION 1.0

    void main (void) {
        vec2 uv = (gl_FragCoord.xy - offset) / resolution;

        float t1 = enterTime / DURATION;
        float t2 = leaveTime / DURATION;
        float t = clamp(min(t1, 1. - t2), 0., 1.);

        if (t == 0.) {
            discard;
        } else if (t < 1.) {
            float b = floor(t * 64.);
            uv = (floor(uv * b) + .5) / b;
        }

        outColor = readTex(src, uv);
    }
    `,focusTransition:`
    ${O}
    ${D}

    uniform float intersection;

    void main (void) {
        vec2 uv = (gl_FragCoord.xy - offset) / resolution;
        float t = smoothstep(0., 1., intersection);

        outColor = mix(
            readTex(src, uv + vec2(1. - t, 0)),
            readTex(src, uv + vec2(-(1. - t), 0)),
            0.5
        ) * intersection;
    }
    `,invert:`
    ${O}
    ${D}

    void main() {
        vec2 uv = (gl_FragCoord.xy - offset) / resolution;
        vec4 color = readTex(src, uv);
        outColor = vec4(1.0 - color.rgb, color.a);
    }
    `,grayscale:`
    ${O}
    ${D}

    void main() {
        vec2 uv = (gl_FragCoord.xy - offset) / resolution;
        vec4 color = readTex(src, uv);
        float gray = dot(color.rgb, vec3(0.299, 0.587, 0.114));
        outColor = vec4(vec3(gray), color.a);
    }
    `,vignette:`
    ${O}
    ${D}

    uniform float intensity;
    uniform float radius;
    uniform float power;

    void main() {
        vec2 uv = (gl_FragCoord.xy - offset) / resolution;
        outColor = readTex(src, uv);

        vec2 p = uv * 2.0 - 1.0;
        p.x *= resolution.x / resolution.y;

        float l = max(length(p) - radius, 0.);
        outColor *= 1. - pow(l, power) * intensity;
    }
    `,chromatic:`
    ${O}
    ${D}

    uniform float intensity;
    uniform float radius;
    uniform float power;


    vec4 mirrorTex(sampler2D tex, vec2 uv) {
        vec2 uv2 = 1. - abs(1. - mod(uv, 2.0));
        return texture(tex, uv2);
    }

    void main() {
        vec2 uv = (gl_FragCoord.xy - offset) / resolution;

        vec2 p = uv * 2.0 - 1.0;
        p.x *= resolution.x / resolution.y;

        float l = max(length(p) - radius, 0.);
        float d = pow(l, power) * (intensity * 0.1);

        vec2 uvR = (uv - .5) / (1.0 + d * 1.) + 0.5;
        vec2 uvG = (uv - .5) / (1.0 + d * 2.) + 0.5;
        vec2 uvB = (uv - .5) / (1.0 + d * 3.) + 0.5;

        vec4 cr = mirrorTex(src, uvR);
        vec4 cg = mirrorTex(src, uvG);
        vec4 cb = mirrorTex(src, uvB);

        outColor = vec4(cr.r, cg.g, cb.b, (cr.a + cg.a + cb.a) / 3.0);
    }
    `};function so(t){if(!t.src||t.src.startsWith("data:"))return!1;try{return new URL(t.src,location.href).origin!==location.origin}catch{return!1}}async function oo(t){const i=await(await fetch(t)).blob();return URL.createObjectURL(i)}async function no(t){const i=Array.from(t.querySelectorAll("img")).filter(n=>n.complete&&n.naturalWidth>0&&so(n));if(i.length===0)return()=>{};const r=new Map,s=[];return await Promise.all(i.map(async n=>{try{const a=await oo(n.src);r.set(n,n.src),s.push(a),await new Promise(f=>{n.addEventListener("load",()=>f(),{once:!0}),n.src=a})}catch{}})),()=>{for(const[n,a]of r)n.src=a;for(const n of s)URL.revokeObjectURL(n)}}const ao=["margin-top","margin-right","margin-bottom","margin-left"],fo=["position","top","right","bottom","left","float","flex","flex-grow","flex-shrink","flex-basis","align-self","justify-self","place-self","order","grid-column","grid-column-start","grid-column-end","grid-row","grid-row-start","grid-row-end","grid-area"],rr=new WeakMap,sr=new WeakMap,or=new WeakMap,nr=new WeakMap,ar=new WeakMap,fr=new WeakMap;async function co(t,e){const i=t.getContext("2d");if(!i)throw new Error("Failed to get 2d context from layoutsubtree canvas");const{onCapture:r,maxSize:s}=e;let n=null,a=null;const f=new Promise(d=>{a=d});t.onpaint=()=>{const d=t.firstElementChild;if(!d||t.width===0||t.height===0)return;i.clearRect(0,0,t.width,t.height),i.drawElementImage(d,0,0);let u=t.width,p=t.height;if(s&&(u>s||p>s)){const w=Math.min(s/u,s/p);u=Math.floor(u*w),p=Math.floor(p*w)}(!n||n.width!==u||n.height!==p)&&(n=new OffscreenCanvas(u,p));const g=n.getContext("2d");if(g){if(g.clearRect(0,0,u,p),g.drawImage(t,0,0,u,p),i.clearRect(0,0,t.width,t.height),a){a(n),a=null;return}r(n)}};const c=new ResizeObserver(d=>{for(const u of d){const p=u.devicePixelContentBoxSize?.[0];if(p)t.width=p.inlineSize,t.height=p.blockSize;else{const g=u.borderBoxSize?.[0];if(g){const w=window.devicePixelRatio;t.width=Math.round(g.inlineSize*w),t.height=Math.round(g.blockSize*w)}}}t.requestPaint()});c.observe(t,{box:"device-pixel-content-box"}),rr.set(t,c);const l=t.firstElementChild;let h="";if(l){const d=new ResizeObserver(u=>{const p=u[0].borderBoxSize?.[0];if(!p)return;const g=`${Math.round(p.blockSize)}px`;g!==h&&(h=g,t.style.setProperty("height",g))});d.observe(l),sr.set(t,d)}return f}function lo(t){t.onpaint=null;const e=rr.get(t);e&&(e.disconnect(),rr.delete(t));const i=sr.get(t);i&&(i.disconnect(),sr.delete(t))}async function uo(t,e){const i=t.getBoundingClientRect(),r=document.createElement("canvas");r.setAttribute("layoutsubtree",""),r.className=t.className;const s=t.getAttribute("style");s&&r.setAttribute("style",s),r.style.setProperty("padding","0"),r.style.setProperty("border","none"),r.style.setProperty("box-sizing","content-box"),r.style.setProperty("background","transparent");const n=getComputedStyle(t),a=n.display==="inline"?"block":n.display;r.style.setProperty("display",a);for(const h of ao)r.style.setProperty(h,n.getPropertyValue(h));for(const h of fo)r.style.setProperty(h,n.getPropertyValue(h));t.style.width.endsWith("px")?r.style.setProperty("width",`${i.width}px`):r.style.setProperty("width","100%"),r.style.height||r.style.setProperty("height",`${i.height}px`);const f=window.devicePixelRatio;r.width=Math.round(i.width*f),r.height=Math.round(i.height*f),or.set(t,t.style.margin),nr.set(t,t.style.width),ar.set(t,t.style.boxSizing),t.parentNode?.insertBefore(r,t),r.appendChild(t),t.style.setProperty("margin","0"),t.style.setProperty("width","100%"),t.style.setProperty("box-sizing","border-box");const c=await no(t);fr.set(r,c);const l=await co(r,e);return{canvas:r,initialCapture:l}}function zr(t,e){lo(t);const i=fr.get(t);i&&(i(),fr.delete(t)),t.parentNode?.insertBefore(e,t),t.remove();const r=or.get(e);r!==void 0&&(e.style.margin=r,or.delete(e));const s=nr.get(e);s!==void 0&&(e.style.width=s,nr.delete(e));const n=ar.get(e);n!==void 0&&(e.style.boxSizing=n,ar.delete(e))}let Et;function ho(){if(Et!==void 0)return Et;try{const t=document.createElement("canvas"),e=t.getContext("2d");Et=e!==null&&typeof e.drawElementImage=="function"&&typeof t.requestPaint=="function"}catch{Et=!1}return Et}function po(t){const e=typeof window<"u"?window.devicePixelRatio:1;let i;t.scrollPadding===void 0?i=[.1,.1]:t.scrollPadding===!1?i=[0,0]:Array.isArray(t.scrollPadding)?i=[t.scrollPadding[0]??.1,t.scrollPadding[1]??.1]:i=[t.scrollPadding,t.scrollPadding];let r;return t.postEffect===void 0?r=[]:Array.isArray(t.postEffect)?r=t.postEffect:r=[t.postEffect],{pixelRatio:t.pixelRatio??e,zIndex:t.zIndex??void 0,autoplay:t.autoplay??!0,fixedCanvas:t.scrollPadding===!1,scrollPadding:i,wrapper:t.wrapper,postEffects:r}}var tt=function(t,e,i,r,s){if(r==="m")throw new TypeError("Private method is not writable");if(r==="a"&&!s)throw new TypeError("Private accessor was defined without a setter");if(typeof e=="function"?t!==e||!s:!e.has(t))throw new TypeError("Cannot write private member to an object whose class did not declare it");return r==="a"?s.call(t,i):s?s.value=i:e.set(t,i),i},ve=function(t,e,i,r){if(i==="a"&&!r)throw new TypeError("Private accessor was defined without a getter");if(typeof e=="function"?t!==e||!r:!e.has(t))throw new TypeError("Cannot read private member from an object whose class did not declare it");return i==="m"?r:i==="a"?r.call(t):r?r.value:e.get(t)},lt,ni,vt,St,it,cr,ds,Or;class N{constructor(e,i,r){lt.add(this),this.wrapS="clamp",this.wrapT="clamp",this.minFilter="linear",this.magFilter="linear",this.needsUpdate=!0,this.source=null,ni.set(this,void 0),vt.set(this,!1),St.set(this,void 0),it.set(this,void 0),tt(this,ni,e,"f"),this.gl=e.gl;const s=r?.externalHandle;tt(this,it,s!==void 0,"f"),s!==void 0?(this.texture=s,tt(this,vt,!0,"f"),this.needsUpdate=!1):ve(this,lt,"m",cr).call(this),i&&(this.source=i),tt(this,St,r?.autoRegister!==!1&&!ve(this,it,"f"),"f"),ve(this,St,"f")&&e.addResource(this)}restore(){ve(this,it,"f")||(ve(this,lt,"m",cr).call(this),tt(this,vt,!1,"f"),this.needsUpdate=!0)}bind(e){const i=this.gl;i.activeTexture(i.TEXTURE0+e),i.bindTexture(i.TEXTURE_2D,this.texture),this.needsUpdate&&(ve(this,lt,"m",ds).call(this),this.needsUpdate=!1)}dispose(){ve(this,St,"f")&&ve(this,ni,"f").removeResource(this),ve(this,it,"f")||this.gl.deleteTexture(this.texture)}}ni=new WeakMap,vt=new WeakMap,St=new WeakMap,it=new WeakMap,lt=new WeakSet,cr=function(){const e=this.gl.createTexture();if(!e)throw new Error("[VFX-JS] Failed to create texture");this.texture=e},ds=function(){const e=this.gl,i=this.source;if(e.pixelStorei(e.UNPACK_FLIP_Y_WEBGL,!0),e.pixelStorei(e.UNPACK_PREMULTIPLY_ALPHA_WEBGL,!1),e.pixelStorei(e.UNPACK_ALIGNMENT,4),i)try{e.texImage2D(e.TEXTURE_2D,0,e.RGBA,e.RGBA,e.UNSIGNED_BYTE,i)}catch(r){console.error(r)}else if(!ve(this,vt,"f")){const r=new Uint8Array([0,0,0,0]);e.texImage2D(e.TEXTURE_2D,0,e.RGBA,1,1,0,e.RGBA,e.UNSIGNED_BYTE,r)}ve(this,lt,"m",Or).call(this),tt(this,vt,!0,"f")},Or=function(){const e=this.gl;e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_S,Dr(e,this.wrapS)),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_T,Dr(e,this.wrapT)),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MIN_FILTER,Xr(e,this.minFilter)),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MAG_FILTER,Xr(e,this.magFilter))};function Dr(t,e){return e==="repeat"?t.REPEAT:e==="mirror"?t.MIRRORED_REPEAT:t.CLAMP_TO_EDGE}function Xr(t,e){return e==="nearest"?t.NEAREST:t.LINEAR}function lr(t){return new Promise((e,i)=>{const r=new Image;r.crossOrigin="anonymous",r.onload=()=>e(r),r.onerror=i,r.src=t})}var mo=function(t,e,i,r,s){if(r==="m")throw new TypeError("Private method is not writable");if(r==="a"&&!s)throw new TypeError("Private accessor was defined without a setter");if(typeof e=="function"?t!==e||!s:!e.has(t))throw new TypeError("Cannot write private member to an object whose class did not declare it");return r==="a"?s.call(t,i):s?s.value=i:e.set(t,i),i},Pt=function(t,e,i,r){if(i==="a"&&!r)throw new TypeError("Private accessor was defined without a getter");if(typeof e=="function"?t!==e||!r:!e.has(t))throw new TypeError("Cannot read private member from an object whose class did not declare it");return i==="m"?r:i==="a"?r.call(t):r?r.value:e.get(t)},Ct,Nt,ai;class Qt{constructor(e,i,r,s={}){Ct.add(this),Nt.set(this,void 0),mo(this,Nt,e,"f"),this.gl=e.gl,this.width=Math.max(1,Math.floor(i)),this.height=Math.max(1,Math.floor(r)),this.float=s.float??!1,this.mipmap=s.mipmap??!1,this.texture=new N(e,void 0,{autoRegister:!1});const n=s.wrap;n!==void 0&&(typeof n=="string"?(this.texture.wrapS=n,this.texture.wrapT=n):(this.texture.wrapS=n[0],this.texture.wrapT=n[1])),s.filter!==void 0&&(this.texture.minFilter=s.filter,this.texture.magFilter=s.filter),Pt(this,Ct,"m",ai).call(this),e.addResource(this)}setSize(e,i){const r=Math.max(1,Math.floor(e)),s=Math.max(1,Math.floor(i));r===this.width&&s===this.height||(this.width=r,this.height=s,Pt(this,Ct,"m",ai).call(this))}restore(){this.texture.restore(),Pt(this,Ct,"m",ai).call(this)}dispose(){Pt(this,Nt,"f").removeResource(this),this.gl.deleteFramebuffer(this.fbo),this.texture.dispose()}generateMipmaps(){if(!this.mipmap)return;const e=this.gl;e.bindTexture(e.TEXTURE_2D,this.texture.texture),e.generateMipmap(e.TEXTURE_2D),e.bindTexture(e.TEXTURE_2D,null)}}Nt=new WeakMap,Ct=new WeakSet,ai=function(){const e=this.gl,i=this.fbo,r=e.createFramebuffer();if(!r)throw new Error("[VFX-JS] Failed to create framebuffer");this.fbo=r;const s=this.texture.texture;e.bindTexture(e.TEXTURE_2D,s);const n=Pt(this,Nt,"f").floatLinearFilter,a=this.float?n?e.RGBA32F:e.RGBA16F:e.RGBA8,f=this.float?n?e.FLOAT:e.HALF_FLOAT:e.UNSIGNED_BYTE;if(this.mipmap){const p=Math.floor(Math.log2(Math.max(this.width,this.height)))+1;let g=this.width,w=this.height;for(let E=0;E<p;E++)e.texImage2D(e.TEXTURE_2D,E,a,g,w,0,e.RGBA,f,null),g=Math.max(1,g>>1),w=Math.max(1,w>>1)}else e.texImage2D(e.TEXTURE_2D,0,a,this.width,this.height,0,e.RGBA,f,null);const c=this.texture.minFilter==="nearest"?e.NEAREST:e.LINEAR,l=this.texture.magFilter==="nearest"?e.NEAREST:e.LINEAR,h=this.mipmap?this.texture.minFilter==="nearest"?e.NEAREST_MIPMAP_NEAREST:e.LINEAR_MIPMAP_LINEAR:c,d=Hr(e,this.texture.wrapS),u=Hr(e,this.texture.wrapT);e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MIN_FILTER,h),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MAG_FILTER,l),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_S,d),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_T,u),e.bindFramebuffer(e.FRAMEBUFFER,r),e.framebufferTexture2D(e.FRAMEBUFFER,e.COLOR_ATTACHMENT0,e.TEXTURE_2D,s,0),e.bindFramebuffer(e.FRAMEBUFFER,null),e.bindTexture(e.TEXTURE_2D,null),this.texture.needsUpdate=!1,this.texture.source=null,i&&e.deleteFramebuffer(i)};function Hr(t,e){return e==="repeat"?t.REPEAT:e==="mirror"?t.MIRRORED_REPEAT:t.CLAMP_TO_EDGE}function ur(t,e,i,r){return{x:t.left+i,y:e-r-t.bottom,w:t.right-t.left,h:t.bottom-t.top}}function wt(t,e,i,r){return{x:t,y:e,w:i,h:r}}var Xe=function(t,e,i,r,s){if(r==="m")throw new TypeError("Private method is not writable");if(r==="a"&&!s)throw new TypeError("Private accessor was defined without a setter");if(typeof e=="function"?t!==e||!s:!e.has(t))throw new TypeError("Cannot write private member to an object whose class did not declare it");return r==="a"?s.call(t,i):s?s.value=i:e.set(t,i),i},oe=function(t,e,i,r){if(i==="a"&&!r)throw new TypeError("Private accessor was defined without a getter");if(typeof e=="function"?t!==e||!r:!e.has(t))throw new TypeError("Cannot read private member from an object whose class did not declare it");return i==="m"?r:i==="a"?r.call(t):r?r.value:e.get(t)},rt,st,Rt,ue;class Zt{constructor(e,i,r,s,n,a={}){rt.set(this,void 0),st.set(this,void 0),Rt.set(this,void 0),ue.set(this,void 0),Xe(this,rt,i,"f"),Xe(this,st,r,"f"),Xe(this,Rt,s,"f");const f=i*s,c=r*s,l={float:n,wrap:a.wrap,filter:a.filter,mipmap:a.mipmap};Xe(this,ue,[new Qt(e,f,c,l),new Qt(e,f,c,l)],"f")}get texture(){return oe(this,ue,"f")[0].texture}get target(){return oe(this,ue,"f")[1]}resize(e,i){if(e===oe(this,rt,"f")&&i===oe(this,st,"f"))return;Xe(this,rt,e,"f"),Xe(this,st,i,"f");const r=e*oe(this,Rt,"f"),s=i*oe(this,Rt,"f");oe(this,ue,"f")[0].setSize(r,s),oe(this,ue,"f")[1].setSize(r,s)}swap(){Xe(this,ue,[oe(this,ue,"f")[1],oe(this,ue,"f")[0]],"f")}getViewport(){return wt(0,0,oe(this,rt,"f"),oe(this,st,"f"))}dispose(){oe(this,ue,"f")[0].dispose(),oe(this,ue,"f")[1].dispose()}}rt=new WeakMap,st=new WeakMap,Rt=new WeakMap,ue=new WeakMap;class ke{constructor(e=0,i=0){this.x=0,this.y=0,this.x=e,this.y=i}set(e,i){return this.x=e,this.y=i,this}}class ei{constructor(e=0,i=0,r=0,s=0){this.x=0,this.y=0,this.z=0,this.w=0,this.x=e,this.y=i,this.z=r,this.w=s}set(e,i,r,s){return this.x=e,this.y=i,this.z=r,this.w=s,this}}var ri=function(t,e,i,r,s){if(r==="m")throw new TypeError("Private method is not writable");if(r==="a"&&!s)throw new TypeError("Private accessor was defined without a setter");if(typeof e=="function"?t!==e||!s:!e.has(t))throw new TypeError("Cannot write private member to an object whose class did not declare it");return r==="a"?s.call(t,i):s?s.value=i:e.set(t,i),i},we=function(t,e,i,r){if(i==="a"&&!r)throw new TypeError("Private accessor was defined without a getter");if(typeof e=="function"?t!==e||!r:!e.has(t))throw new TypeError("Cannot read private member from an object whose class did not declare it");return i==="m"?r:i==="a"?r.call(t):r?r.value:e.get(t)},fi,ci,Mi,Ai,Gt,yt,hr;function ps(t){return/#version\s+300\s+es\b/.test(t)?"300 es":/#version\s+100\b/.test(t)||/\bgl_FragColor\b|\btexture2D\b|\bvarying\b|\battribute\b/.test(t)?"100":"300 es"}class ms{constructor(e,i,r,s){fi.add(this),ci.set(this,void 0),Mi.set(this,void 0),Ai.set(this,void 0),Gt.set(this,void 0),yt.set(this,new Map),ri(this,ci,e,"f"),this.gl=e.gl,ri(this,Mi,i,"f"),ri(this,Ai,r,"f"),ri(this,Gt,s??ps(r),"f"),we(this,fi,"m",hr).call(this),e.addResource(this)}restore(){we(this,fi,"m",hr).call(this)}use(){this.gl.useProgram(this.program)}hasUniform(e){return we(this,yt,"f").has(e)}uploadUniforms(e){const i=this.gl;let r=0;for(const[s,n]of we(this,yt,"f")){const a=e[s];if(!a)continue;const f=a.value;if(f!=null){if(go(n.type)){f instanceof N&&(f.bind(r),i.uniform1i(n.location,r),r++);continue}f instanceof N||vo(i,n,f)}}}dispose(){we(this,ci,"f").removeResource(this),this.gl.deleteProgram(this.program)}}ci=new WeakMap,Mi=new WeakMap,Ai=new WeakMap,Gt=new WeakMap,yt=new WeakMap,fi=new WeakSet,hr=function(){const e=this.gl,i=Nr(e,e.VERTEX_SHADER,Gr(we(this,Mi,"f"),we(this,Gt,"f"))),r=Nr(e,e.FRAGMENT_SHADER,Gr(we(this,Ai,"f"),we(this,Gt,"f"))),s=e.createProgram();if(!s)throw new Error("[VFX-JS] Failed to create program");if(e.attachShader(s,i),e.attachShader(s,r),e.bindAttribLocation(s,0,"position"),e.linkProgram(s),!e.getProgramParameter(s,e.LINK_STATUS)){const a=e.getProgramInfoLog(s)??"";throw e.deleteShader(i),e.deleteShader(r),e.deleteProgram(s),new Error(`[VFX-JS] Program link failed: ${a}`)}e.detachShader(s,i),e.detachShader(s,r),e.deleteShader(i),e.deleteShader(r),this.program=s,we(this,yt,"f").clear();const n=e.getProgramParameter(s,e.ACTIVE_UNIFORMS);for(let a=0;a<n;a++){const f=e.getActiveUniform(s,a);if(!f)continue;const c=f.name.replace(/\[0\]$/,""),l=e.getUniformLocation(s,f.name);l&&we(this,yt,"f").set(c,{location:l,type:f.type,size:f.size})}};function Nr(t,e,i){const r=t.createShader(e);if(!r)throw new Error("[VFX-JS] Failed to create shader");if(t.shaderSource(r,i),t.compileShader(r),!t.getShaderParameter(r,t.COMPILE_STATUS)){const s=t.getShaderInfoLog(r)??"";throw t.deleteShader(r),new Error(`[VFX-JS] Shader compile failed: ${s}

${i}`)}return r}function Gr(t,e){return t.replace(/^\s+/,"").startsWith("#version")||e==="100"?t:`#version 300 es
${t}`}function go(t){return t===35678||t===36298||t===36306||t===35682}const $r=new Set;function vo(t,e,i){const r=e.location,s=e.size>1,n=i,a=i,f=i;switch(e.type){case t.FLOAT:s?t.uniform1fv(r,n):t.uniform1f(r,i);return;case t.FLOAT_VEC2:if(s)t.uniform2fv(r,n);else if(i instanceof ke)t.uniform2f(r,i.x,i.y);else{const c=i;t.uniform2f(r,c[0],c[1])}return;case t.FLOAT_VEC3:if(s)t.uniform3fv(r,n);else{const c=i;t.uniform3f(r,c[0],c[1],c[2])}return;case t.FLOAT_VEC4:if(s)t.uniform4fv(r,n);else if(i instanceof ei)t.uniform4f(r,i.x,i.y,i.z,i.w);else{const c=i;t.uniform4f(r,c[0],c[1],c[2],c[3])}return;case t.INT:s?t.uniform1iv(r,a):t.uniform1i(r,i);return;case t.INT_VEC2:if(s)t.uniform2iv(r,a);else{const c=i;t.uniform2i(r,c[0],c[1])}return;case t.INT_VEC3:if(s)t.uniform3iv(r,a);else{const c=i;t.uniform3i(r,c[0],c[1],c[2])}return;case t.INT_VEC4:if(s)t.uniform4iv(r,a);else{const c=i;t.uniform4i(r,c[0],c[1],c[2],c[3])}return;case t.BOOL:s?t.uniform1iv(r,a):t.uniform1i(r,i?1:0);return;case t.BOOL_VEC2:if(s)t.uniform2iv(r,a);else{const c=i;t.uniform2i(r,c[0]?1:0,c[1]?1:0)}return;case t.BOOL_VEC3:if(s)t.uniform3iv(r,a);else{const c=i;t.uniform3i(r,c[0]?1:0,c[1]?1:0,c[2]?1:0)}return;case t.BOOL_VEC4:if(s)t.uniform4iv(r,a);else{const c=i;t.uniform4i(r,c[0]?1:0,c[1]?1:0,c[2]?1:0,c[3]?1:0)}return;case t.FLOAT_MAT2:t.uniformMatrix2fv(r,!1,n);return;case t.FLOAT_MAT3:t.uniformMatrix3fv(r,!1,n);return;case t.FLOAT_MAT4:t.uniformMatrix4fv(r,!1,n);return;case t.UNSIGNED_INT:s?t.uniform1uiv(r,f):t.uniform1ui(r,i);return;case t.UNSIGNED_INT_VEC2:if(s)t.uniform2uiv(r,f);else{const c=i;t.uniform2ui(r,c[0],c[1])}return;case t.UNSIGNED_INT_VEC3:if(s)t.uniform3uiv(r,f);else{const c=i;t.uniform3ui(r,c[0],c[1],c[2])}return;case t.UNSIGNED_INT_VEC4:if(s)t.uniform4uiv(r,f);else{const c=i;t.uniform4ui(r,c[0],c[1],c[2],c[3])}return;default:$r.has(e.type)||($r.add(e.type),console.warn(`[VFX-JS] Unsupported uniform type 0x${e.type.toString(16)}; skipping upload.`));return}}class gs{constructor(e,i,r,s,n,a){this.gl=e.gl,this.program=new ms(e,i,r,a),this.uniforms=s,this.blend=n}dispose(){this.program.dispose()}}function wo(t,e,i,r,s,n,a,f){const c=r?r.width/f:n,l=r?r.height/f:a,h=Math.max(0,s.x),d=Math.max(0,s.y),u=Math.min(c,s.x+s.w),p=Math.min(l,s.y+s.h),g=u-h,w=p-d;g<=0||w<=0||(t.bindFramebuffer(t.FRAMEBUFFER,r?r.fbo:null),t.viewport(Math.round(h*f),Math.round(d*f),Math.round(g*f),Math.round(w*f)),vs(t,i.blend),i.program.use(),i.program.uploadUniforms(i.uniforms),e.draw())}function vs(t,e){if(e==="none"){t.disable(t.BLEND);return}t.enable(t.BLEND),t.blendEquation(t.FUNC_ADD),e==="premultiplied"?t.blendFuncSeparate(t.ONE,t.ONE_MINUS_SRC_ALPHA,t.ONE,t.ONE_MINUS_SRC_ALPHA):e==="additive"?t.blendFuncSeparate(t.ONE,t.ONE,t.ONE,t.ONE):t.blendFuncSeparate(t.SRC_ALPHA,t.ONE_MINUS_SRC_ALPHA,t.ONE,t.ONE_MINUS_SRC_ALPHA)}class yo{constructor(e){this.uniforms={src:{value:null},offset:{value:new ke},resolution:{value:new ke},viewport:{value:new ei}},this.pass=new gs(e,us,hs,this.uniforms,"premultiplied")}setUniforms(e,i,r){this.uniforms.src.value=e,this.uniforms.resolution.value.set(r.w*i,r.h*i),this.uniforms.offset.value.set(r.x*i,r.y*i)}dispose(){this.pass.dispose()}}const bo=t=>{const e=document.implementation.createHTMLDocument("test"),i=e.createRange();i.selectNodeContents(e.documentElement),i.deleteContents();const r=document.createElement("head");return e.documentElement.appendChild(r),e.documentElement.appendChild(i.createContextualFragment(t)),e.documentElement.setAttribute("xmlns",e.documentElement.namespaceURI),new XMLSerializer().serializeToString(e).replace(/<!DOCTYPE html>/,"")};async function dr(t,e,i,r){const s=t.getBoundingClientRect(),n=window.devicePixelRatio,a=Math.ceil(s.width),f=Math.ceil(s.height),c=a*n,l=f*n;let h=1,d=c,u=l;r&&(d>r||u>r)&&(h=Math.min(r/d,r/u),d=Math.floor(d*h),u=Math.floor(u*h));const p=i&&i.width===d&&i.height===u?i:new OffscreenCanvas(d,u),g=t.cloneNode(!0);await ws(t,g),ys(t,g),g.style.setProperty("opacity",e.toString()),g.style.setProperty("margin","0px"),_o(g),g.style.setProperty("box-sizing","border-box"),g.style.setProperty("width",`${a}px`),g.style.setProperty("height",`${f}px`);const w=g.outerHTML,E=bo(w),C=`<svg xmlns="http://www.w3.org/2000/svg" width="${c}" height="${l}"><foreignObject width="100%" height="100%">${E}</foreignObject></svg>`;return new Promise((y,T)=>{const b=new Image;b.onload=()=>{const S=p.getContext("2d");if(S===null)return T();S.clearRect(0,0,d,u);const W=n*h;S.scale(W,W),S.drawImage(b,0,0,c,l),S.setTransform(1,0,0,1,0,0),y(p)},b.src=`data:image/svg+xml;charset=utf-8,${encodeURIComponent(C)}`})}async function ws(t,e){const i=window.getComputedStyle(t);for(const r of Array.from(i))/(-inline-|-block-|^inline-|^block-)/.test(r)||/^-webkit-.*(start|end|before|after|logical)/.test(r)||e.style.setProperty(r,i.getPropertyValue(r),i.getPropertyPriority(r));if(e.tagName==="INPUT")e.setAttribute("value",e.value);else if(e.tagName==="TEXTAREA")e.innerHTML=e.value;else if(e.tagName==="IMG")try{e.src=await xo(t.src)}catch{}for(let r=0;r<t.children.length;r++){const s=t.children[r],n=e.children[r];await ws(s,n)}}function ys(t,e){if(typeof t.computedStyleMap=="function")try{const i=t.computedStyleMap();for(const r of["margin-top","margin-right","margin-bottom","margin-left"]){const s=i.get(r);s instanceof CSSKeywordValue&&s.value==="auto"&&e.style.setProperty(r,"auto")}}catch{}for(let i=0;i<t.children.length;i++){const r=t.children[i],s=e.children[i];r instanceof HTMLElement&&s instanceof HTMLElement&&ys(r,s)}}function _o(t){let e=t;for(;;){const i=e.style;if(Number.parseFloat(i.paddingTop)>0||Number.parseFloat(i.borderTopWidth)>0||i.getPropertyValue("overflow-x")&&i.getPropertyValue("overflow-x")!=="visible"||i.getPropertyValue("overflow-y")&&i.getPropertyValue("overflow-y")!=="visible"||i.display==="flex"||i.display==="grid"||i.display==="flow-root"||i.display==="inline-block")break;const r=e.firstElementChild;if(!r)break;r.style.setProperty("margin-top","0px"),e=r}for(e=t;;){const i=e.style;if(Number.parseFloat(i.paddingBottom)>0||Number.parseFloat(i.borderBottomWidth)>0||i.getPropertyValue("overflow-x")&&i.getPropertyValue("overflow-x")!=="visible"||i.getPropertyValue("overflow-y")&&i.getPropertyValue("overflow-y")!=="visible"||i.display==="flex"||i.display==="grid"||i.display==="flow-root"||i.display==="inline-block")break;const r=e.lastElementChild;if(!r)break;r.style.setProperty("margin-bottom","0px"),e=r}}async function xo(t){const e=await fetch(t).then(i=>i.blob());return new Promise(i=>{const r=new FileReader;r.onload=function(){i(this.result)},r.readAsDataURL(e)})}var de=function(t,e,i,r,s){if(r==="m")throw new TypeError("Private method is not writable");if(r==="a"&&!s)throw new TypeError("Private accessor was defined without a setter");if(typeof e=="function"?t!==e||!s:!e.has(t))throw new TypeError("Cannot write private member to an object whose class did not declare it");return r==="a"?s.call(t,i):s?s.value=i:e.set(t,i),i},q=function(t,e,i,r){if(i==="a"&&!r)throw new TypeError("Private accessor was defined without a getter");if(typeof e=="function"?t!==e||!r:!e.has(t))throw new TypeError("Cannot read private member from an object whose class did not declare it");return i==="m"?r:i==="a"?r.call(t):r?r.value:e.get(t)},li,ui,ut,ki,ht,Be,Ft,pr,hi,di,pi,Mt;const Rr=Object.freeze({__brand:"EffectQuad"});function To(t){return t===Rr}function Eo(t,e){switch(e){case"lines":return t.LINES;case"lineStrip":return t.LINE_STRIP;case"points":return t.POINTS;default:return t.TRIANGLES}}function So(t,e){if(e instanceof Float32Array)return t.FLOAT;if(e instanceof Uint8Array)return t.UNSIGNED_BYTE;if(e instanceof Uint16Array)return t.UNSIGNED_SHORT;if(e instanceof Uint32Array)return t.UNSIGNED_INT;if(e instanceof Int8Array)return t.BYTE;if(e instanceof Int16Array)return t.SHORT;if(e instanceof Int32Array)return t.INT;throw new Error("[VFX-JS] Unsupported attribute typed array")}function Po(t,e){if(ArrayBuffer.isView(e)&&!(e instanceof DataView))return{name:t,data:e,itemSize:2,normalized:!1,perInstance:!1};const i=e;return{name:t,data:i.data,itemSize:i.itemSize,normalized:i.normalized??!1,perInstance:i.perInstance??!1}}class Co{constructor(e,i,r){li.add(this),ui.set(this,void 0),ut.set(this,void 0),ki.set(this,void 0),ht.set(this,[]),Be.set(this,null),this.indexType=0,this.hasIndices=!1,this.drawCount=0,this.drawStart=0,Ft.set(this,!1),de(this,ui,e,"f"),this.gl=e.gl,de(this,ut,i,"f"),de(this,ki,r,"f"),this.mode=Eo(this.gl,i.mode),this.instanceCount=i.instanceCount??0,q(this,li,"m",pr).call(this),e.addResource(this),de(this,Ft,!0,"f")}restore(){de(this,ht,[],"f"),de(this,Be,null,"f"),q(this,li,"m",pr).call(this)}draw(){const e=this.gl;e.bindVertexArray(this.vao),this.hasIndices?this.instanceCount>0?e.drawElementsInstanced(this.mode,this.drawCount,this.indexType,this.drawStart*(this.indexType===e.UNSIGNED_INT?4:2),this.instanceCount):e.drawElements(this.mode,this.drawCount,this.indexType,this.drawStart*(this.indexType===e.UNSIGNED_INT?4:2)):this.instanceCount>0?e.drawArraysInstanced(this.mode,this.drawStart,this.drawCount,this.instanceCount):e.drawArrays(this.mode,this.drawStart,this.drawCount)}dispose(){q(this,Ft,"f")&&(q(this,ui,"f").removeResource(this),de(this,Ft,!1,"f"));const e=this.gl;e.deleteVertexArray(this.vao);for(const i of q(this,ht,"f"))e.deleteBuffer(i);q(this,Be,"f")&&e.deleteBuffer(q(this,Be,"f")),de(this,ht,[],"f"),de(this,Be,null,"f")}}ui=new WeakMap,ut=new WeakMap,ki=new WeakMap,ht=new WeakMap,Be=new WeakMap,Ft=new WeakMap,li=new WeakSet,pr=function(){const e=this.gl,i=e.createVertexArray();if(!i)throw new Error("[VFX-JS] Failed to create VAO");this.vao=i,e.bindVertexArray(i);const r=q(this,ki,"f").program;let s=null;for(const[l,h]of Object.entries(q(this,ut,"f").attributes)){const d=Po(l,h),u=e.getAttribLocation(r,d.name);if(u<0)continue;const p=e.createBuffer();if(!p)throw new Error(`[VFX-JS] Failed to create VBO for "${d.name}"`);q(this,ht,"f").push(p),e.bindBuffer(e.ARRAY_BUFFER,p),e.bufferData(e.ARRAY_BUFFER,d.data,e.STATIC_DRAW);const g=So(e,d.data);e.enableVertexAttribArray(u),g===e.FLOAT||g===e.HALF_FLOAT||d.normalized?e.vertexAttribPointer(u,d.itemSize,g,d.normalized,0,0):e.vertexAttribIPointer(u,d.itemSize,g,0,0),d.perInstance&&e.vertexAttribDivisor(u,1),l==="position"&&s===null&&(s=d.data.length/d.itemSize)}let n=0;const a=q(this,ut,"f").indices;if(a){const l=e.createBuffer();if(!l)throw new Error("[VFX-JS] Failed to create IBO");de(this,Be,l,"f"),e.bindBuffer(e.ELEMENT_ARRAY_BUFFER,l),e.bufferData(e.ELEMENT_ARRAY_BUFFER,a,e.STATIC_DRAW),this.hasIndices=!0,this.indexType=a instanceof Uint32Array?e.UNSIGNED_INT:e.UNSIGNED_SHORT,n=a.length}else this.hasIndices=!1;e.bindVertexArray(null),e.bindBuffer(e.ARRAY_BUFFER,null),q(this,Be,"f")&&e.bindBuffer(e.ELEMENT_ARRAY_BUFFER,null);const f=this.hasIndices?n:s??0,c=q(this,ut,"f").drawRange;this.drawStart=c?.start??0,this.drawCount=c?.count!==void 0?c.count:Math.max(0,f-this.drawStart)};class Ro{constructor(e,i){hi.set(this,void 0),di.set(this,void 0),pi.set(this,new WeakMap),Mt.set(this,new Set),de(this,hi,e,"f"),de(this,di,i,"f")}get quad(){return q(this,di,"f")}resolve(e,i){let r=q(this,pi,"f").get(e);r||(r=new Map,q(this,pi,"f").set(e,r));let s=r.get(i);return s||(s=new Co(q(this,hi,"f"),e,i),r.set(i,s),q(this,Mt,"f").add(s)),s}dispose(){for(const e of q(this,Mt,"f"))e.dispose();q(this,Mt,"f").clear()}}hi=new WeakMap,di=new WeakMap,pi=new WeakMap,Mt=new WeakMap;var j=function(t,e,i,r,s){if(r==="m")throw new TypeError("Private method is not writable");if(r==="a"&&!s)throw new TypeError("Private accessor was defined without a setter");if(typeof e=="function"?t!==e||!s:!e.has(t))throw new TypeError("Cannot write private member to an object whose class did not declare it");return r==="a"?s.call(t,i):s?s.value=i:e.set(t,i),i},v=function(t,e,i,r){if(i==="a"&&!r)throw new TypeError("Private accessor was defined without a getter");if(typeof e=="function"?t!==e||!r:!e.has(t))throw new TypeError("Cannot read private member from an object whose class did not declare it");return i==="m"?r:i==="a"?r.call(t):r?r.value:e.get(t)},ye,We,dt,pt,Ii,bt,$t,Je,Ye,At,be,ot,J,Z,bs,qr,_s,qt,xs,Ts,mi,jr;const Es=Symbol.for("@vfx-js/effect.resolve-texture"),Ss=Symbol.for("@vfx-js/effect.resolve-rt");function Fo(t){return t[Es]()}function Fr(t){return t[Ss]}const Mo=`#version 300 es
precision highp float;
in vec3 position;
out vec2 uv;
out vec2 uvContent;
out vec2 uvSrc;
uniform vec4 contentRectUv;
uniform vec4 srcRectUv;
void main() {
    vec2 bufferUV = position.xy * 0.5 + 0.5;
    uv = bufferUV;
    uvContent = (bufferUV - contentRectUv.xy) / contentRectUv.zw;
    uvSrc = srcRectUv.xy + uvContent * srcRectUv.zw;
    gl_Position = vec4(position, 1.0);
}
`,Ao=`
precision highp float;
attribute vec3 position;
varying vec2 uv;
varying vec2 uvContent;
varying vec2 uvSrc;
uniform vec4 contentRectUv;
uniform vec4 srcRectUv;
void main() {
    vec2 bufferUV = position.xy * 0.5 + 0.5;
    uv = bufferUV;
    uvContent = (bufferUV - contentRectUv.xy) / contentRectUv.zw;
    uvSrc = srcRectUv.xy + uvContent * srcRectUv.zw;
    gl_Position = vec4(position, 1.0);
}
`,ko=`#version 300 es
precision highp float;
in vec2 uv;
out vec4 outColor;
uniform sampler2D src;
void main() {
    outColor = texture(src, uv);
}
`,Io=`
precision highp float;
varying vec2 uv;
uniform sampler2D src;
void main() {
    gl_FragColor = texture2D(src, uv);
}
`,Vo=`#version 300 es
precision highp float;
in vec2 uvSrc;
out vec4 outColor;
uniform sampler2D src;
void main() {
    outColor = texture(src, uvSrc);
}
`,Lo=`
precision highp float;
varying vec2 uvSrc;
uniform sampler2D src;
void main() {
    gl_FragColor = texture2D(src, uvSrc);
}
`;class Uo{constructor(e,i,r,s,n,a){ye.add(this),We.set(this,void 0),dt.set(this,void 0),pt.set(this,void 0),Ii.set(this,void 0),bt.set(this,void 0),$t.set(this,[]),Je.set(this,[]),Ye.set(this,[]),At.set(this,[]),be.set(this,"init"),ot.set(this,!1),J.set(this,void 0),Z.set(this,void 0),qt.set(this,[]),j(this,We,e,"f"),j(this,dt,e.gl,"f"),j(this,pt,r,"f"),j(this,Ii,a,"f"),j(this,bt,new Ro(e,i),"f"),j(this,J,{outputBufferW:1,outputBufferH:1,canvasBufferSize:[1,1],outputViewport:{x:0,y:0,w:1,h:1},elementBufferW:1,elementBufferH:1,contentRectUv:[0,0,1,1],srcRectUv:[0,0,1,1]},"f");const c={time:0,deltaTime:0,pixelRatio:r,resolution:[1,1],mouse:[0,0],mouseViewport:[0,0],intersection:0,enterTime:0,leaveTime:0,src:s,target:null,uniforms:{},vfxProps:n,dims:{element:[1,1],elementPixel:[1,1],canvas:[1,1],canvasPixel:[1,1],pixelRatio:r,contentRect:[0,0,1,1],srcRect:[0,0,1,1],canvasRect:[0,0,1,1]},quad:Rr,gl:v(this,dt,"f"),createRenderTarget:l=>v(this,ye,"m",bs).call(this,l),wrapTexture:(l,h)=>v(this,ye,"m",_s).call(this,l,h),draw:l=>v(this,ye,"m",xs).call(this,l),blit:(l,h,d)=>v(this,ye,"m",Ts).call(this,l,h,d),onContextRestored:l=>{const h=v(this,We,"f").onContextRestored(l);return v(this,At,"f").push(h),h}};j(this,Z,c,"f")}get ctx(){return v(this,Z,"f")}setPhase(e){j(this,be,e,"f")}setFrameDims(e){j(this,J,e,"f"),v(this,Z,"f").resolution=[e.canvasBufferSize[0],e.canvasBufferSize[1]];for(const i of v(this,Ye,"f"))i.resolver.resize?.(e.outputBufferW,e.outputBufferH)}setEffectDims(e){v(this,Z,"f").dims=e}setFrameState(e){const i=v(this,Z,"f");i.time=e.time,i.deltaTime=e.deltaTime,i.mouse=e.mouse,i.mouseViewport=e.mouseViewport,i.intersection=e.intersection,i.enterTime=e.enterTime,i.leaveTime=e.leaveTime,i.uniforms=e.uniforms}setSrc(e){v(this,Z,"f").src=e}setOutput(e){v(this,Z,"f").target=e}passthroughCopy(e,i,r){const s=v(this,be,"f");j(this,be,"render","f");const n=v(this,Z,"f").target;v(this,Z,"f").target=i;try{const a=v(this,J,"f").outputViewport;v(this,J,"f").outputViewport={...r};const c=v(this,Z,"f").vfxProps.glslVersion==="100"?Io:ko;v(this,ye,"m",mi).call(this,{frag:c,uniforms:{src:e},target:i}),v(this,J,"f").outputViewport=a}finally{v(this,Z,"f").target=n,j(this,be,s,"f")}}clearRt(e){const i=v(this,dt,"f"),r=Fr(e);i.bindFramebuffer(i.FRAMEBUFFER,r.getWriteFbo().fbo),i.viewport(0,0,e.width,e.height),i.clearColor(0,0,0,0),i.disable(i.SCISSOR_TEST),i.clear(i.COLOR_BUFFER_BIT),i.bindFramebuffer(i.FRAMEBUFFER,null)}tickAutoUpdates(){for(const e of v(this,qt,"f"))e()}dispose(){j(this,be,"disposed","f");for(const e of v(this,At,"f"))e();j(this,At,[],"f");for(const e of v(this,Je,"f"))e.resolver.dispose?.();j(this,Je,[],"f"),j(this,Ye,[],"f");for(const e of v(this,$t,"f"))e.dispose();j(this,$t,[],"f"),v(this,bt,"f").dispose(),j(this,qt,[],"f")}}We=new WeakMap,dt=new WeakMap,pt=new WeakMap,Ii=new WeakMap,bt=new WeakMap,$t=new WeakMap,Je=new WeakMap,Ye=new WeakMap,At=new WeakMap,be=new WeakMap,ot=new WeakMap,J=new WeakMap,Z=new WeakMap,qt=new WeakMap,ye=new WeakSet,bs=function(e){const i=e?.persistent??!1,r=e?.float??!1,s=Jr(e?.wrap),n=e?.filter,a=e?.mipmap??!1,f=a!==!1,c=a===!0,l=e?.size,h=l?l[0]:v(this,J,"f").outputBufferW,d=l?l[1]:v(this,J,"f").outputBufferH;let u,p,g;if(i){const y=l?1:v(this,pt,"f"),T=l?h:h/y,b=l?d:d/y,S=new Zt(v(this,We,"f"),T,b,y,r,{wrap:s,filter:n,mipmap:f});u={getReadTexture:()=>S.texture,getWriteFbo:()=>S.target,swap:()=>S.swap(),resize:l?void 0:(W,A)=>{S.resize(W/v(this,pt,"f"),A/v(this,pt,"f"))},dispose:()=>S.dispose()},f&&(u.regenerateMipmaps=()=>S.target.generateMipmaps(),u.mipmapAutoRegen=c),p=()=>S.target.width,g=()=>S.target.height}else{const y=new Qt(v(this,We,"f"),h,d,{float:r,wrap:s,filter:n,mipmap:f});u={getReadTexture:()=>y.texture,getWriteFbo:()=>y,resize:l?void 0:(T,b)=>y.setSize(T,b),dispose:()=>y.dispose()},f&&(u.regenerateMipmaps=()=>y.generateMipmaps(),u.mipmapAutoRegen=c),p=()=>y.width,g=()=>y.height}let w;const C=Ps(u,p,g,()=>v(this,ye,"m",qr).call(this,w));return w={handle:C,resolver:u},v(this,Je,"f").push(w),l||v(this,Ye,"f").push(w),C},qr=function(e){const i=v(this,Je,"f").indexOf(e);if(i<0)return;v(this,Je,"f").splice(i,1);const r=v(this,Ye,"f").indexOf(e);r>=0&&v(this,Ye,"f").splice(r,1),e.resolver.dispose?.()},_s=function(e,i){const r=Jr(i?.wrap),s=i?.filter;let n,a,f,c=null;if(Bo(e)){if(!i?.size)throw new Error("[VFX-JS] wrapTexture(WebGLTexture) requires opts.size");const[h,d]=i.size;n=new N(v(this,We,"f"),void 0,{autoRegister:!1,externalHandle:e}),a=()=>h,f=()=>d}else{const h=e;n=new N(v(this,We,"f"),h);const d=i?.size,u=w=>{if(d)return w==="w"?d[0]:d[1];if(typeof HTMLImageElement<"u"&&h instanceof HTMLImageElement)return w==="w"?h.naturalWidth:h.naturalHeight;if(typeof HTMLVideoElement<"u"&&h instanceof HTMLVideoElement)return w==="w"?h.videoWidth:h.videoHeight;const E=h;return w==="w"?E.width:E.height};a=()=>u("w"),f=()=>u("h");const p=typeof HTMLVideoElement<"u"&&h instanceof HTMLVideoElement||typeof HTMLCanvasElement<"u"&&h instanceof HTMLCanvasElement||typeof OffscreenCanvas<"u"&&h instanceof OffscreenCanvas;(i?.autoUpdate??p)&&(c=()=>{n.needsUpdate=!0})}return n.wrapS=r[0],n.wrapT=r[1],s!==void 0&&(n.minFilter=s,n.magFilter=s),v(this,$t,"f").push(n),c&&v(this,qt,"f").push(c),Vi(()=>n,a,f)},xs=function(e){if(v(this,be,"f")!=="render"){v(this,be,"f")==="update"&&!v(this,ot,"f")&&(j(this,ot,!0,"f"),console.warn("[VFX-JS] ctx.draw() called in update(); ignored. Move draws to render()."));return}v(this,ye,"m",mi).call(this,e)},Ts=function(e,i,r){if(v(this,be,"f")!=="render"){v(this,be,"f")==="update"&&!v(this,ot,"f")&&(j(this,ot,!0,"f"),console.warn("[VFX-JS] ctx.blit() called in update(); ignored. Move draws to render()."));return}const s=v(this,Z,"f").vfxProps.glslVersion==="100"?Lo:Vo;v(this,ye,"m",mi).call(this,{frag:s,uniforms:{src:e},target:i,blend:r?.blend,swap:r?.swap})},mi=function(e){const i=v(this,dt,"f"),r=e.vert??(v(this,Z,"f").vfxProps.glslVersion==="100"?Ao:Mo),s=v(this,Ii,"f").get(r,e.frag,v(this,Z,"f").vfxProps.glslVersion),n=v(this,Z,"f").target,a=e.target===void 0||e.target===null?n:e.target,f=a===null||a===n;let c,l,h,d,u,p,g;if(a===null)c=null,l=v(this,J,"f").outputViewport.x,h=v(this,J,"f").outputViewport.y,d=v(this,J,"f").outputViewport.w,u=v(this,J,"f").outputViewport.h;else{const y=Fr(a);c=y.getWriteFbo().fbo,f?(l=v(this,J,"f").outputViewport.x,h=v(this,J,"f").outputViewport.y,d=v(this,J,"f").outputViewport.w,u=v(this,J,"f").outputViewport.h):(l=0,h=0,d=a.width,u=a.height),p=y.swap,y.mipmapAutoRegen&&(g=y.regenerateMipmaps)}i.bindFramebuffer(i.FRAMEBUFFER,c),i.viewport(l,h,d,u),i.disable(i.SCISSOR_TEST);const w=e.blend??(a===null?"premultiplied":"none");vs(i,w),s.use();const E=v(this,ye,"m",jr).call(this,e.uniforms);s.uploadUniforms(E);const C=e.geometry??Rr;To(C)?v(this,bt,"f").quad.draw():v(this,bt,"f").resolve(C,s).draw(),g?.(),p&&e.swap!==!1&&p()},jr=function(e){const i={};if(i.contentRectUv={value:v(this,J,"f").contentRectUv},i.srcRectUv={value:v(this,J,"f").srcRectUv},!e)return i;for(const[r,s]of Object.entries(e))i[r]=Wo(s);return i};function Bo(t){const e=globalThis.WebGLTexture;if(e&&typeof e=="function"&&t instanceof e)return!0;const i=t;return i.width===void 0&&i.naturalWidth===void 0&&i.videoWidth===void 0}function Jr(t){return t===void 0?["clamp","clamp"]:typeof t=="string"?[t,t]:[t[0],t[1]]}function Wo(t){return typeof t=="object"&&t!==null&&"__brand"in t?t.__brand==="EffectRenderTarget"?{value:Fr(t).getReadTexture()}:{value:Fo(t)}:{value:t}}function Vi(t,e,i){const r={__brand:"EffectTexture",get width(){return e()},get height(){return i()}};return Object.defineProperty(r,Es,{value:t}),r}function Ps(t,e,i,r){const s={__brand:"EffectRenderTarget",get width(){return e()},get height(){return i()},dispose:r??(()=>{}),generateMipmaps:()=>t.regenerateMipmaps?.()};return Object.defineProperty(s,Ss,{value:t}),s}function Cs(t){return Ps({getReadTexture:()=>t.texture,getWriteFbo:()=>t},()=>t.width,()=>t.height)}function Rs(t){return typeof t=="number"?{top:t,right:t,bottom:t,left:t}:Array.isArray(t)?{top:t[0],right:t[1],bottom:t[2],left:t[3]}:{top:t.top??0,right:t.right??0,bottom:t.bottom??0,left:t.left??0}}function ti(t){return Rs(t)}const Yr={top:0,right:0,bottom:0,left:0};function Li(t){return Rs(t)}function mr(t){return{top:t.top,right:t.right,bottom:t.bottom,left:t.left}}function gr(t){return{top:t.top,left:t.left,right:t.left+Math.ceil(t.right-t.left),bottom:t.top+Math.ceil(t.bottom-t.top)}}function vr(t,e){return{top:t.top-e.top,right:t.right+e.right,bottom:t.bottom+e.bottom,left:t.left-e.left}}function si(t,e,i){return Math.min(Math.max(t,e),i)}function zo(t,e){const[i,r,s,n]=t,[a,f,c,l]=e;return c<=0||l<=0?[0,0,1,1]:[(i-a)/c,(r-f)/l,s/c,n/l]}function Oo(t,e){const i=si(e.left,t.left,t.right),s=(si(e.right,t.left,t.right)-i)/(e.right-e.left),n=si(e.top,t.top,t.bottom),f=(si(e.bottom,t.top,t.bottom)-n)/(e.bottom-e.top);return s*f}var U=function(t,e,i,r,s){if(r==="m")throw new TypeError("Private method is not writable");if(r==="a"&&!s)throw new TypeError("Private accessor was defined without a setter");if(typeof e=="function"?t!==e||!s:!e.has(t))throw new TypeError("Cannot write private member to an object whose class did not declare it");return r==="a"?s.call(t,i):s?s.value=i:e.set(t,i),i},m=function(t,e,i,r){if(i==="a"&&!r)throw new TypeError("Private accessor was defined without a getter");if(typeof e=="function"?t!==e||!r:!e.has(t))throw new TypeError("Cannot read private member from an object whose class did not declare it");return i==="m"?r:i==="a"?r.call(t):r?r.value:e.get(t)},$,jt,Ui,Bi,Wi,zi,ie,K,pe,Re,me,mt,Ge,nt,Ue,Oi,he,gi,kt,wr,Fs,Kr,Yi,Ms,Qr,Ki,As;class Zr{constructor(e,i,r,s,n,a,f,c){$.add(this),jt.set(this,void 0),Ui.set(this,void 0),Bi.set(this,void 0),Wi.set(this,void 0),zi.set(this,void 0),ie.set(this,void 0),K.set(this,void 0),pe.set(this,void 0),Re.set(this,[]),me.set(this,[]),mt.set(this,void 0),Ge.set(this,new Set),nt.set(this,!1),Ue.set(this,void 0),Oi.set(this,ti(0)),he.set(this,null),U(this,jt,e,"f"),U(this,Ui,i,"f"),U(this,Bi,r,"f"),U(this,Wi,n,"f"),U(this,zi,c,"f"),U(this,ie,s,"f"),U(this,mt,a,"f"),U(this,Ue,f,"f"),U(this,K,s.map(()=>m(this,$,"m",kt).call(this)),"f"),s.length===0&&U(this,he,m(this,$,"m",kt).call(this),"f"),U(this,pe,m(this,$,"m",gi).call(this),"f")}get effects(){return m(this,ie,"f")}get hosts(){return m(this,K,"f")}get renderingIndices(){return m(this,pe,"f")}get stages(){return m(this,me,"f")}get hitTestPadBuffer(){return m(this,Oi,"f")}async initAll(){for(let e=0;e<m(this,ie,"f").length;e++){const i=m(this,ie,"f")[e],r=m(this,K,"f")[e];r.setPhase("init");try{i.init&&await i.init(r.ctx)}catch(s){console.error(`[VFX-JS] effect[${e}].init() failed:`,s);for(let n=e-1;n>=0;n--)m(this,$,"m",wr).call(this,n),m(this,K,"f")[n].dispose();throw m(this,K,"f")[e].dispose(),s}r.setPhase("update")}}run(e){if(m(this,nt,"f")||!e.isVisible)return;U(this,pe,m(this,$,"m",gi).call(this),"f");const i=m(this,pe,"f").length;for(const r of m(this,K,"f"))r.setFrameState({time:e.time,deltaTime:e.deltaTime,mouse:e.mouse,mouseViewport:e.mouseViewport,intersection:e.intersection,enterTime:e.enterTime,leaveTime:e.leaveTime,uniforms:e.resolvedUniforms});m(this,$,"m",Fs).call(this,e);for(let r=0;r<m(this,K,"f").length;r++)m(this,K,"f")[r].setFrameDims(m(this,$,"m",As).call(this,r,e)),m(this,K,"f")[r].setEffectDims(m(this,$,"m",Ms).call(this,r,e));for(let r=0;r<m(this,ie,"f").length;r++){const s=m(this,ie,"f")[r];if(!s.update)continue;const n=m(this,K,"f")[r];n.setPhase("update");try{s.update(n.ctx)}catch(a){const f=`${r}:update`;m(this,Ge,"f").has(f)||(m(this,Ge,"f").add(f),console.warn(`[VFX-JS] effect[${r}].update() threw; skipping this frame's update:`,a))}}if(i===0){(m(this,he,"f")??m(this,K,"f")[0]).passthroughCopy(m(this,mt,"f"),e.finalTarget,e.elementRectOnCanvasPx);return}for(let r=0;r<i;r++){const s=m(this,pe,"f")[r],n=m(this,K,"f")[s],a=m(this,ie,"f")[s];if(!a.render)continue;n.setPhase("render"),n.tickAutoUpdates();const f=r===0?m(this,mt,"f"):m(this,Re,"f")[r-1].texHandle;n.setSrc(f);let c;r===i-1?c=e.finalTarget:(c=m(this,Re,"f")[r].rtHandle,n.clearRt(c)),n.setOutput(c);try{a.render(n.ctx)}catch(l){const h=`${s}:render`;m(this,Ge,"f").has(h)||(m(this,Ge,"f").add(h),console.warn(`[VFX-JS] effect[${s}].render() threw; falling back to passthrough:`,l));const d=m(this,me,"f")[r].outputViewport;c===null?n.passthroughCopy(f,null,d):r===i-1?n.passthroughCopy(f,c,d):n.passthroughCopy(f,c,{x:0,y:0,w:c.width,h:c.height})}n.setPhase("update")}}dispose(){if(!m(this,nt,"f")){U(this,nt,!0,"f");for(let e=m(this,ie,"f").length-1;e>=0;e--)m(this,$,"m",wr).call(this,e),m(this,K,"f")[e].dispose();m(this,he,"f")&&(m(this,he,"f").dispose(),U(this,he,null,"f"));for(const e of m(this,Re,"f"))e.fb.dispose();U(this,Re,[],"f"),U(this,me,[],"f")}}async replaceEffects(e){if(m(this,nt,"f"))throw new Error("[VFX-JS] replaceEffects on disposed chain");const i=m(this,ie,"f"),r=m(this,K,"f"),s=new Map;for(let f=0;f<i.length;f++)s.set(i[f],r[f]);const n=new Array(e.length),a=[];for(let f=0;f<e.length;f++){const c=e[f],l=s.get(c);if(l)n[f]=l,s.delete(c);else{const h=m(this,$,"m",kt).call(this);n[f]=h,a.push({host:h,effect:c})}}for(let f=0;f<a.length;f++){const{host:c,effect:l}=a[f];c.setPhase("init");try{l.init&&await l.init(c.ctx),c.setPhase("update")}catch(h){console.error("[VFX-JS] replaceEffects: new effect init() failed:",h);for(let d=f-1;d>=0;d--){const u=a[d];if(u.effect.dispose)try{u.effect.dispose()}catch(p){console.error("[VFX-JS] dispose during init rollback threw:",p)}u.host.dispose()}throw c.dispose(),h}}for(const[f,c]of s){if(f.dispose)try{f.dispose()}catch(l){console.error("[VFX-JS] effect.dispose() threw during replaceEffects:",l)}c.dispose()}for(const f of m(this,Re,"f"))f.fb.dispose();U(this,Re,[],"f"),U(this,me,[],"f"),e.length===0&&!m(this,he,"f")?U(this,he,m(this,$,"m",kt).call(this),"f"):e.length>0&&m(this,he,"f")&&(m(this,he,"f").dispose(),U(this,he,null,"f")),U(this,ie,e,"f"),U(this,K,n,"f"),U(this,pe,m(this,$,"m",gi).call(this),"f"),m(this,Ge,"f").clear()}}jt=new WeakMap,Ui=new WeakMap,Bi=new WeakMap,Wi=new WeakMap,zi=new WeakMap,ie=new WeakMap,K=new WeakMap,pe=new WeakMap,Re=new WeakMap,me=new WeakMap,mt=new WeakMap,Ge=new WeakMap,nt=new WeakMap,Ue=new WeakMap,Oi=new WeakMap,he=new WeakMap,$=new WeakSet,gi=function(){return m(this,ie,"f").map((e,i)=>typeof e.render=="function"&&e.enabled!==!1?i:-1).filter(e=>e>=0)},kt=function(){return new Uo(m(this,jt,"f"),m(this,Ui,"f"),m(this,Bi,"f"),m(this,mt,"f"),m(this,Wi,"f"),m(this,zi,"f"))},wr=function(e){const i=m(this,ie,"f")[e];if(i.dispose)try{i.dispose()}catch(r){console.error(`[VFX-JS] effect[${e}].dispose() threw:`,r)}},Fs=function(e){const i=m(this,pe,"f").length;if(U(this,me,new Array(i),"f"),i===0)return;const r=m(this,Ue,"f")?e.canvasBufferSize:e.elementBufferSize,s=[0,0,r[0],r[1]],n=m(this,$,"m",Ki).call(this,e);let a=s;for(let d=0;d<i;d++){const u=m(this,pe,"f")[d],p=m(this,ie,"f")[u],g=d===i-1,E=m(this,$,"m",Kr).call(this,p,a,s,n,e)??a,C=[E[2],E[3]],y=zo(s,E),T=g?{x:e.elementRectOnCanvasPx.x+E[0],y:e.elementRectOnCanvasPx.y+E[1],w:C[0],h:C[1]}:{x:0,y:0,w:C[0],h:C[1]};m(this,me,"f")[d]={dstRect:E,dstBufferSize:C,contentRectUv:y,outputViewport:T},g||m(this,$,"m",Qr).call(this,d,C),a=E}const[f,c,l,h]=m(this,me,"f")[i-1].dstRect;U(this,Oi,ti({top:Math.max(0,c+h-r[1]),right:Math.max(0,f+l-r[0]),bottom:Math.max(0,-c),left:Math.max(0,-f)}),"f")},Kr=function(e,i,r,s,n){if(e.outputRect)return e.outputRect(m(this,$,"m",Yi).call(this,n,r,i,s))},Yi=function(e,i,r,s){const n=e.canvasBufferSize[0]/e.canvasSize[0]||1;return{element:m(this,Ue,"f")?e.canvasSize:e.elementSize,elementPixel:m(this,Ue,"f")?e.canvasBufferSize:e.elementBufferSize,canvas:e.canvasSize,canvasPixel:e.canvasBufferSize,pixelRatio:n,contentRect:i,srcRect:r,canvasRect:s}},Ms=function(e,i){const r=m(this,Ue,"f")?i.canvasBufferSize:i.elementBufferSize,s=[0,0,r[0],r[1]],n=m(this,$,"m",Ki).call(this,i),a=m(this,pe,"f").indexOf(e),f=a<=0?s:m(this,me,"f")[a-1].dstRect;return m(this,$,"m",Yi).call(this,i,s,f,n)},Qr=function(e,i){const r=m(this,Re,"f")[e];if(r&&r.fb.width===i[0]&&r.fb.height===i[1])return;r&&r.fb.dispose();const s=new Qt(m(this,jt,"f"),i[0],i[1]),n=Cs(s),a=Vi(()=>s.texture,()=>s.width,()=>s.height);m(this,Re,"f")[e]={fb:s,rtHandle:n,texHandle:a,bufferSize:i}},Ki=function(e){const[i,r]=e.canvasBufferSize;if(m(this,Ue,"f"))return[0,0,i,r];const{x:s,y:n}=e.elementRectOnCanvasPx;return[-s,-n,i,r]},As=function(e,i){const r=m(this,pe,"f").indexOf(e);let s,n,a,f,c;if(r<0)s=i.elementBufferSize[0],n=i.elementBufferSize[1],a={x:0,y:0,w:s,h:n},f=[0,0,1,1],c=[0,0,1,1];else{const l=m(this,me,"f")[r];s=l.dstBufferSize[0],n=l.dstBufferSize[1],a=l.outputViewport,f=l.contentRectUv,c=r===0?[0,0,1,1]:m(this,me,"f")[r-1].contentRectUv}return{outputBufferW:s,outputBufferH:n,canvasBufferSize:i.canvasBufferSize,outputViewport:a,elementBufferW:i.elementBufferSize[0],elementBufferH:i.elementBufferSize[1],contentRectUv:f,srcRectUv:c}};function Oe(t){this.data=t,this.pos=0}Oe.prototype.readByte=function(){return this.data[this.pos++]};Oe.prototype.peekByte=function(){return this.data[this.pos]};Oe.prototype.readBytes=function(t){return this.data.subarray(this.pos,this.pos+=t)};Oe.prototype.peekBytes=function(t){return this.data.subarray(this.pos,this.pos+t)};Oe.prototype.readString=function(t){for(var e="",i=0;i<t;i++)e+=String.fromCharCode(this.readByte());return e};Oe.prototype.readBitArray=function(){for(var t=[],e=this.readByte(),i=7;i>=0;i--)t.push(!!(e&1<<i));return t};Oe.prototype.readUnsigned=function(t){var e=this.readBytes(2);return t?(e[1]<<8)+e[0]:(e[0]<<8)+e[1]};function ii(t){this.stream=new Oe(t),this.output={}}ii.prototype.parse=function(t){return this.parseParts(this.output,t),this.output};ii.prototype.parseParts=function(t,e){for(var i=0;i<e.length;i++){var r=e[i];this.parsePart(t,r)}};ii.prototype.parsePart=function(t,e){var i=e.label,r;if(!(e.requires&&!e.requires(this.stream,this.output,t)))if(e.loop){for(var s=[];e.loop(this.stream);){var n={};this.parseParts(n,e.parts),s.push(n)}t[i]=s}else e.parts?(r={},this.parseParts(r,e.parts),t[i]=r):e.parser?(r=e.parser(this.stream,this.output,t),e.skip||(t[i]=r)):e.bits&&(t[i]=this.parseBits(e.bits))};function Do(t){return t.reduce(function(e,i){return e*2+i},0)}ii.prototype.parseBits=function(t){var e={},i=this.stream.readBitArray();for(var r in t){var s=t[r];s.length?e[r]=Do(i.slice(s.index,s.index+s.length)):e[r]=i[s.index]}return e};var B={readByte:function(){return function(t){return t.readByte()}},readBytes:function(t){return function(e){return e.readBytes(t)}},readString:function(t){return function(e){return e.readString(t)}},readUnsigned:function(t){return function(e){return e.readUnsigned(t)}},readArray:function(t,e){return function(i,r,s){for(var n=e(i,r,s),a=new Array(n),f=0;f<n;f++)a[f]=i.readBytes(t);return a}}},Gi={label:"blocks",parser:function(t){for(var e=[],i=0,r=0,s=t.readByte();s!==r;s=t.readByte())e.push(t.readBytes(s)),i+=s;var n=new Uint8Array(i);i=0;for(var a=0;a<e.length;a++)n.set(e[a],i),i+=e[a].length;return n}},Xo={label:"gce",requires:function(t){var e=t.peekBytes(2);return e[0]===33&&e[1]===249},parts:[{label:"codes",parser:B.readBytes(2),skip:!0},{label:"byteSize",parser:B.readByte()},{label:"extras",bits:{future:{index:0,length:3},disposal:{index:3,length:3},userInput:{index:6},transparentColorGiven:{index:7}}},{label:"delay",parser:B.readUnsigned(!0)},{label:"transparentColorIndex",parser:B.readByte()},{label:"terminator",parser:B.readByte(),skip:!0}]},Ho={label:"image",requires:function(t){var e=t.peekByte();return e===44},parts:[{label:"code",parser:B.readByte(),skip:!0},{label:"descriptor",parts:[{label:"left",parser:B.readUnsigned(!0)},{label:"top",parser:B.readUnsigned(!0)},{label:"width",parser:B.readUnsigned(!0)},{label:"height",parser:B.readUnsigned(!0)},{label:"lct",bits:{exists:{index:0},interlaced:{index:1},sort:{index:2},future:{index:3,length:2},size:{index:5,length:3}}}]},{label:"lct",requires:function(t,e,i){return i.descriptor.lct.exists},parser:B.readArray(3,function(t,e,i){return Math.pow(2,i.descriptor.lct.size+1)})},{label:"data",parts:[{label:"minCodeSize",parser:B.readByte()},Gi]}]},No={label:"text",requires:function(t){var e=t.peekBytes(2);return e[0]===33&&e[1]===1},parts:[{label:"codes",parser:B.readBytes(2),skip:!0},{label:"blockSize",parser:B.readByte()},{label:"preData",parser:function(t,e,i){return t.readBytes(i.text.blockSize)}},Gi]},Go={label:"application",requires:function(t,e,i){var r=t.peekBytes(2);return r[0]===33&&r[1]===255},parts:[{label:"codes",parser:B.readBytes(2),skip:!0},{label:"blockSize",parser:B.readByte()},{label:"id",parser:function(t,e,i){return t.readString(i.blockSize)}},Gi]},$o={label:"comment",requires:function(t,e,i){var r=t.peekBytes(2);return r[0]===33&&r[1]===254},parts:[{label:"codes",parser:B.readBytes(2),skip:!0},Gi]},qo={label:"frames",parts:[Xo,Go,$o,Ho,No],loop:function(t){var e=t.peekByte();return e===33||e===44}},jo=[{label:"header",parts:[{label:"signature",parser:B.readString(3)},{label:"version",parser:B.readString(3)}]},{label:"lsd",parts:[{label:"width",parser:B.readUnsigned(!0)},{label:"height",parser:B.readUnsigned(!0)},{label:"gct",bits:{exists:{index:0},resolution:{index:1,length:3},sort:{index:4},size:{index:5,length:3}}},{label:"backgroundColorIndex",parser:B.readByte()},{label:"pixelAspectRatio",parser:B.readByte()}]},{label:"gct",requires:function(t,e){return e.lsd.gct.exists},parser:B.readArray(3,function(t,e){return Math.pow(2,e.lsd.gct.size+1)})},qo];function Mr(t){var e=new Uint8Array(t),i=new ii(e);this.raw=i.parse(jo),this.raw.hasImages=!1;for(var r=0;r<this.raw.frames.length;r++)if(this.raw.frames[r].image){this.raw.hasImages=!0;break}}Mr.prototype.decompressFrame=function(t,e){if(t>=this.raw.frames.length)return null;var i=this.raw.frames[t];if(i.image){var r=i.image.descriptor.width*i.image.descriptor.height,s=a(i.image.data.minCodeSize,i.image.data.blocks,r);i.image.descriptor.lct.interlaced&&(s=f(s,i.image.descriptor.width));var n={pixels:s,dims:{top:i.image.descriptor.top,left:i.image.descriptor.left,width:i.image.descriptor.width,height:i.image.descriptor.height}};return i.image.descriptor.lct&&i.image.descriptor.lct.exists?n.colorTable=i.image.lct:n.colorTable=this.raw.gct,i.gce&&(n.delay=(i.gce.delay||10)*10,n.disposalType=i.gce.extras.disposal,i.gce.extras.transparentColorGiven&&(n.transparentIndex=i.gce.transparentColorIndex)),e&&(n.patch=c(n)),n}return null;function a(l,h,d){var u=4096,p=-1,g=d,w,E,C,y,T,b,S,W,A,H,R,_,k,z,le,Ie,De=new Array(d),ee=new Array(u),te=new Array(u),Tt=new Array(u+1);for(_=l,E=1<<_,T=E+1,w=E+2,S=p,y=_+1,C=(1<<y)-1,A=0;A<E;A++)ee[A]=0,te[A]=A;for(R=W=k=z=Ie=le=0,H=0;H<g;){if(z===0){if(W<y){R+=h[le]<<W,W+=8,le++;continue}if(A=R&C,R>>=y,W-=y,A>w||A==T)break;if(A==E){y=_+1,C=(1<<y)-1,w=E+2,S=p;continue}if(S==p){Tt[z++]=te[A],S=A,k=A;continue}for(b=A,A==w&&(Tt[z++]=k,A=S);A>E;)Tt[z++]=te[A],A=ee[A];k=te[A]&255,Tt[z++]=k,w<u&&(ee[w]=S,te[w]=k,w++,(w&C)===0&&w<u&&(y++,C+=w)),S=b}z--,De[Ie++]=Tt[z],H++}for(H=Ie;H<g;H++)De[H]=0;return De}function f(l,h){for(var d=new Array(l.length),u=l.length/h,p=function(T,b){var S=l.slice(b*h,(b+1)*h);d.splice.apply(d,[T*h,h].concat(S))},g=[0,4,2,1],w=[8,8,4,2],E=0,C=0;C<4;C++)for(var y=g[C];y<u;y+=w[C])p(y,E),E++;return d}function c(l){for(var h=l.pixels.length,d=new Uint8ClampedArray(h*4),u=0;u<h;u++){var p=u*4,g=l.pixels[u],w=l.colorTable[g];d[p]=w[0],d[p+1]=w[1],d[p+2]=w[2],d[p+3]=g!==l.transparentIndex?255:0}return d}};Mr.prototype.decompressFrames=function(t,e,i){e===void 0&&(e=0),i===void 0?i=this.raw.frames.length:i=Math.min(i,this.raw.frames.length);for(var r=[],s=e;s<i;s++){var n=this.raw.frames[s];n.image&&r.push(this.decompressFrame(s,t))}return r};class $i{static async create(e,i){const r=await fetch(e).then(f=>f.arrayBuffer()).then(f=>new Mr(f)),s=r.decompressFrames(!0,void 0,void 0),{width:n,height:a}=r.raw.lsd;return new $i(s,n,a,i)}constructor(e,i,r,s){this.frames=[],this.index=0,this.playTime=0,this.frames=e,this.canvas=document.createElement("canvas"),this.ctx=this.canvas.getContext("2d"),this.pixelRatio=s,this.canvas.width=i,this.canvas.height=r,this.startTime=Date.now()}getCanvas(){return this.canvas}update(){const i=Date.now()-this.startTime;for(;this.playTime<i;){const n=this.frames[this.index%this.frames.length];this.playTime+=n.delay,this.index++}const r=this.frames[this.index%this.frames.length],s=new ImageData(r.patch,r.dims.width,r.dims.height);this.ctx.clearRect(0,0,this.canvas.width,this.canvas.height),this.ctx.putImageData(s,r.dims.left,r.dims.top)}}var ge=function(t,e,i,r){if(i==="a"&&!r)throw new TypeError("Private accessor was defined without a getter");if(typeof e=="function"?t!==e||!r:!e.has(t))throw new TypeError("Cannot read private member from an object whose class did not declare it");return i==="m"?r:i==="a"?r.call(t):r?r.value:e.get(t)},It,Vt,Lt,yr,br;class Jo{constructor(e){this.isContextLost=!1,It.set(this,new Set),Vt.set(this,new Set),Lt.set(this,new Set),yr.set(this,r=>{r.preventDefault(),this.isContextLost=!0;for(const s of ge(this,Vt,"f"))s()}),br.set(this,()=>{this.isContextLost=!1;const r=this.gl;r.getExtension("EXT_color_buffer_float"),r.getExtension("EXT_color_buffer_half_float");for(const s of ge(this,It,"f"))s.restore();for(const s of ge(this,Lt,"f"))s()});const i=e.getContext("webgl2",{alpha:!0,premultipliedAlpha:!0,antialias:!1,depth:!1,stencil:!1,preserveDrawingBuffer:!1});if(!i)throw new Error("[VFX-JS] WebGL2 is not available.");this.gl=i,this.canvas=e,i.getExtension("EXT_color_buffer_float"),i.getExtension("EXT_color_buffer_half_float"),this.floatLinearFilter=!!i.getExtension("OES_texture_float_linear"),this.maxTextureSize=i.getParameter(i.MAX_TEXTURE_SIZE),e.addEventListener("webglcontextlost",ge(this,yr,"f"),!1),e.addEventListener("webglcontextrestored",ge(this,br,"f"),!1)}setSize(e,i,r){const s=Math.floor(e*r),n=Math.floor(i*r);(this.canvas.width!==s||this.canvas.height!==n)&&(this.canvas.width=s,this.canvas.height=n)}addResource(e){ge(this,It,"f").add(e)}removeResource(e){ge(this,It,"f").delete(e)}onContextLost(e){return ge(this,Vt,"f").add(e),()=>ge(this,Vt,"f").delete(e)}onContextRestored(e){return ge(this,Lt,"f").add(e),()=>ge(this,Lt,"f").delete(e)}}It=new WeakMap,Vt=new WeakMap,Lt=new WeakMap,yr=new WeakMap,br=new WeakMap;var ks=function(t,e,i,r,s){if(r==="m")throw new TypeError("Private method is not writable");if(r==="a"&&!s)throw new TypeError("Private accessor was defined without a setter");if(typeof e=="function"?t!==e||!s:!e.has(t))throw new TypeError("Cannot write private member to an object whose class did not declare it");return r==="a"?s.call(t,i):s?s.value=i:e.set(t,i),i},oi=function(t,e,i,r){if(i==="a"&&!r)throw new TypeError("Private accessor was defined without a getter");if(typeof e=="function"?t!==e||!r:!e.has(t))throw new TypeError("Cannot read private member from an object whose class did not declare it");return i==="m"?r:i==="a"?r.call(t):r?r.value:e.get(t)},vi,wi,Di,_r;class Yo{constructor(e){vi.add(this),wi.set(this,void 0),Di.set(this,void 0),ks(this,wi,e,"f"),this.gl=e.gl,oi(this,vi,"m",_r).call(this),e.addResource(this)}restore(){oi(this,vi,"m",_r).call(this)}draw(){const e=this.gl;e.bindVertexArray(this.vao),e.drawArrays(e.TRIANGLES,0,6)}dispose(){oi(this,wi,"f").removeResource(this),this.gl.deleteVertexArray(this.vao),this.gl.deleteBuffer(oi(this,Di,"f"))}}wi=new WeakMap,Di=new WeakMap,vi=new WeakSet,_r=function(){const e=this.gl,i=e.createVertexArray(),r=e.createBuffer();if(!i||!r)throw new Error("[VFX-JS] Failed to create quad VAO");this.vao=i,ks(this,Di,r,"f");const s=new Float32Array([-1,-1,0,1,-1,0,-1,1,0,-1,1,0,1,-1,0,1,1,0]);e.bindVertexArray(i),e.bindBuffer(e.ARRAY_BUFFER,r),e.bufferData(e.ARRAY_BUFFER,s,e.STATIC_DRAW),e.enableVertexAttribArray(0),e.vertexAttribPointer(0,3,e.FLOAT,!1,0,0),e.bindVertexArray(null),e.bindBuffer(e.ARRAY_BUFFER,null)};function xr(t,e,i,r={}){return new Qt(t,e,i,{float:r.float??!1})}function Is(t,e){const i=e.renderingToBuffer??!1;let r;i?r="none":e.premultipliedAlpha?r="premultiplied":r="normal";const s=e.glslVersion??ps(e.fragmentShader),n=e.vertexShader??(s==="100"?ro:us);return new gs(t,n,e.fragmentShader,e.uniforms,r,s)}var He=function(t,e,i,r,s){if(r==="m")throw new TypeError("Private method is not writable");if(r==="a"&&!s)throw new TypeError("Private accessor was defined without a setter");if(typeof e=="function"?t!==e||!s:!e.has(t))throw new TypeError("Cannot write private member to an object whose class did not declare it");return r==="a"?s.call(t,i):s?s.value=i:e.set(t,i),i},I=function(t,e,i,r){if(i==="a"&&!r)throw new TypeError("Private accessor was defined without a getter");if(typeof e=="function"?t!==e||!r:!e.has(t))throw new TypeError("Cannot read private member from an object whose class did not declare it");return i==="m"?r:i==="a"?r.call(t):r?r.value:e.get(t)},Y,Ut,Me,Bt,at,Ve;class es{constructor(e,i,r,s,n,a,f,c){if(Y.set(this,void 0),Ut.set(this,void 0),Me.set(this,void 0),Bt.set(this,void 0),at.set(this,void 0),Ve.set(this,void 0),He(this,Bt,s??!1,"f"),He(this,at,n??!1,"f"),He(this,Ve,a,"f"),He(this,Ut,{},"f"),He(this,Y,{src:{value:null},offset:{value:new ke},resolution:{value:new ke},viewport:{value:new ei},time:{value:0},mouse:{value:new ke},passIndex:{value:0}},"f"),r)for(const[l,h]of Object.entries(r))typeof h=="function"?(I(this,Ut,"f")[l]=h,I(this,Y,"f")[l]={value:h()}):I(this,Y,"f")[l]={value:h};this.pass=Is(e,{fragmentShader:i,uniforms:I(this,Y,"f"),renderingToBuffer:f??!1,premultipliedAlpha:!0,glslVersion:c})}get uniforms(){return I(this,Y,"f")}setUniforms(e,i,r,s,n,a){I(this,Y,"f").src.value=e,I(this,Y,"f").resolution.value.set(r.w*i,r.h*i),I(this,Y,"f").offset.value.set(r.x*i,r.y*i),I(this,Y,"f").time.value=s,I(this,Y,"f").mouse.value.set(n*i,a*i)}updateCustomUniforms(e){for(const[i,r]of Object.entries(I(this,Ut,"f")))I(this,Y,"f")[i]&&(I(this,Y,"f")[i].value=r());if(e)for(const[i,r]of Object.entries(e))I(this,Y,"f")[i]&&(I(this,Y,"f")[i].value=r())}initializeBackbuffer(e,i,r,s){I(this,Bt,"f")&&!I(this,Me,"f")&&(I(this,Ve,"f")?He(this,Me,new Zt(e,I(this,Ve,"f")[0],I(this,Ve,"f")[1],1,I(this,at,"f")),"f"):He(this,Me,new Zt(e,i,r,s,I(this,at,"f")),"f"))}resizeBackbuffer(e,i){I(this,Me,"f")&&!I(this,Ve,"f")&&I(this,Me,"f").resize(e,i)}registerBufferUniform(e){I(this,Y,"f")[e]||(I(this,Y,"f")[e]={value:null})}get backbuffer(){return I(this,Me,"f")}get persistent(){return I(this,Bt,"f")}get float(){return I(this,at,"f")}get size(){return I(this,Ve,"f")}dispose(){this.pass.dispose(),I(this,Me,"f")?.dispose()}}Y=new WeakMap,Ut=new WeakMap,Me=new WeakMap,Bt=new WeakMap,at=new WeakMap,Ve=new WeakMap;var Ko=function(t,e,i,r,s){if(r==="m")throw new TypeError("Private method is not writable");if(r==="a"&&!s)throw new TypeError("Private accessor was defined without a setter");if(typeof e=="function"?t!==e||!s:!e.has(t))throw new TypeError("Cannot write private member to an object whose class did not declare it");return r==="a"?s.call(t,i):s?s.value=i:e.set(t,i),i},et=function(t,e,i,r){if(i==="a"&&!r)throw new TypeError("Private accessor was defined without a getter");if(typeof e=="function"?t!==e||!r:!e.has(t))throw new TypeError("Cannot read private member from an object whose class did not declare it");return i==="m"?r:i==="a"?r.call(t):r?r.value:e.get(t)},yi,$e;class Qo{constructor(e){yi.set(this,void 0),$e.set(this,new Map),Ko(this,yi,e,"f")}get(e,i,r){const s=`${i}\0${e}\0${r??""}`;let n=et(this,$e,"f").get(s);return n||(n=new ms(et(this,yi,"f"),e,i,r),et(this,$e,"f").set(s,n)),n}get size(){return et(this,$e,"f").size}dispose(){for(const e of et(this,$e,"f").values())e.dispose();et(this,$e,"f").clear()}}yi=new WeakMap,$e=new WeakMap;var L=function(t,e,i,r,s){if(r==="m")throw new TypeError("Private method is not writable");if(r==="a"&&!s)throw new TypeError("Private accessor was defined without a setter");if(typeof e=="function"?t!==e||!s:!e.has(t))throw new TypeError("Cannot write private member to an object whose class did not declare it");return r==="a"?s.call(t,i):s?s.value=i:e.set(t,i),i},o=function(t,e,i,r){if(i==="a"&&!r)throw new TypeError("Private accessor was defined without a getter");if(typeof e=="function"?t!==e||!r:!e.has(t))throw new TypeError("Cannot read private member from an object whose class did not declare it");return i==="m"?r:i==="a"?r.call(t):r?r.value:e.get(t)},P,Ce,Ae,M,je,Ke,_t,fe,ae,X,gt,ne,Qe,ze,Wt,bi,zt,Le,x,Q,Ot,re,Dt,qe,_e,xe,Te,Ee,Xt,Vs,Ht,_i,xi,Ls,Us,Ti,Bs,Tr,Qi,Ei,ts,Xi,Zi,ce,Si,Ws,is,zs,Os,Ds;const Hi=new Map;class Zo{constructor(e,i){P.add(this),Ce.set(this,void 0),Ae.set(this,void 0),M.set(this,void 0),je.set(this,void 0),Ke.set(this,void 0),_t.set(this,void 0),fe.set(this,void 0),ae.set(this,[]),X.set(this,void 0),gt.set(this,new Map),ne.set(this,null),Qe.set(this,!1),ze.set(this,new WeakSet),Wt.set(this,{}),bi.set(this,{}),zt.set(this,0),Le.set(this,void 0),x.set(this,2),Q.set(this,[]),Ot.set(this,Date.now()/1e3),re.set(this,Li(0)),Dt.set(this,Li(0)),qe.set(this,[0,0]),_e.set(this,0),xe.set(this,0),Te.set(this,0),Ee.set(this,0),Xt.set(this,new WeakMap),Ht.set(this,async()=>{if(typeof window<"u"){for(const r of o(this,Q,"f"))if(r.type==="text"&&r.isInViewport){const s=r.element.getBoundingClientRect(),n=Math.ceil(s.width),a=Math.ceil(s.height);(n!==r.width||a!==r.height)&&(await o(this,P,"m",xi).call(this,r),r.width=n,r.height=a)}for(const r of o(this,Q,"f"))if(r.type==="text"&&!r.isInViewport){const s=r.element.getBoundingClientRect(),n=Math.ceil(s.width),a=Math.ceil(s.height);(n!==r.width||a!==r.height)&&(await o(this,P,"m",xi).call(this,r),r.width=n,r.height=a)}}}),_i.set(this,r=>{typeof window<"u"&&(L(this,Te,r.clientX,"f"),L(this,Ee,window.innerHeight-r.clientY,"f"))}),Ti.set(this,()=>{this.isPlaying()&&(this.render(),L(this,Le,requestAnimationFrame(o(this,Ti,"f")),"f"))}),L(this,Ce,e,"f"),L(this,Ae,i,"f"),L(this,M,new Jo(i),"f"),L(this,je,o(this,M,"f").gl,"f"),o(this,je,"f").clearColor(0,0,0,0),L(this,x,e.pixelRatio,"f"),L(this,Ke,new Yo(o(this,M,"f")),"f"),L(this,_t,new Qo(o(this,M,"f")),"f"),typeof window<"u"&&(window.addEventListener("resize",o(this,Ht,"f")),window.addEventListener("pointermove",o(this,_i,"f"))),o(this,Ht,"f").call(this),L(this,fe,new yo(o(this,M,"f")),"f"),o(this,P,"m",Ws).call(this,e.postEffects),o(this,M,"f").onContextRestored(()=>{o(this,je,"f").clearColor(0,0,0,0)})}destroy(){this.stop(),typeof window<"u"&&(window.removeEventListener("resize",o(this,Ht,"f")),window.removeEventListener("pointermove",o(this,_i,"f"))),o(this,X,"f")?.dispose();for(const e of o(this,gt,"f").values())e?.dispose();for(const e of o(this,ae,"f"))e.pass.dispose();o(this,ne,"f")&&(o(this,ne,"f").dispose(),L(this,ne,null,"f"),L(this,Qe,!1,"f")),o(this,fe,"f").dispose(),o(this,_t,"f").dispose(),o(this,Ke,"f").dispose()}async addElement(e,i={},r){if(i.effect!==void 0)return o(this,P,"m",Ls).call(this,e,i,i.effect,r);const s=o(this,P,"m",Us).call(this,i),n=e.getBoundingClientRect(),a=$s(e)?gr(n):mr(n),[f,c]=Hs(i.overflow),l=vr(a,c),h=Ns(i.intersection),d=e.style.opacity===""?1:Number.parseFloat(e.style.opacity);let u,p,g=!1;if(e instanceof HTMLImageElement)if(p="img",g=!!e.src.match(/\.gif/i),g){const _=await $i.create(e.src,o(this,x,"f"));Hi.set(e,_),u=new N(o(this,M,"f"),_.getCanvas())}else{const _=await lr(e.src);u=new N(o(this,M,"f"),_)}else if(e instanceof HTMLVideoElement)u=new N(o(this,M,"f"),e),p="video";else if(e instanceof HTMLCanvasElement)e.hasAttribute("layoutsubtree")&&r?(u=new N(o(this,M,"f"),r),p="hic"):(u=new N(o(this,M,"f"),e),p="canvas");else{const _=await dr(e,d,void 0,this.maxTextureSize);u=new N(o(this,M,"f"),_),p="text"}const[w,E]=Gs(i.wrap);u.wrapS=w,u.wrapT=E,u.needsUpdate=!0;const C=i.autoCrop??!0;if(p!=="hic"){if(i.overlay!==!0)if(typeof i.overlay=="number")e.style.setProperty("opacity",i.overlay.toString());else{const _=p==="video"?"0.0001":"0";e.style.setProperty("opacity",_.toString())}}const y={src:{value:u},resolution:{value:new ke},offset:{value:new ke},time:{value:0},enterTime:{value:-1},leaveTime:{value:-1},mouse:{value:new ke},intersection:{value:0},viewport:{value:new ei},autoCrop:{value:C}},T={};if(i.uniforms!==void 0)for(const[_,k]of Object.entries(i.uniforms))typeof k=="function"?(y[_]={value:k()},T[_]=k):y[_]={value:k};let b;i.backbuffer&&(b=(()=>{const _=(l.right-l.left)*o(this,x,"f"),k=(l.bottom-l.top)*o(this,x,"f");return new Zt(o(this,M,"f"),_,k,o(this,x,"f"),!1)})(),y.backbuffer={value:b.texture});const S=new Map,W=new Map;for(let _=0;_<s.length-1;_++){const k=s[_].target??`pass${_}`;s[_]={...s[_],target:k};const z=s[_].size,le=z?z[0]:(l.right-l.left)*o(this,x,"f"),Ie=z?z[1]:(l.bottom-l.top)*o(this,x,"f");if(s[_].persistent){const De=z?1:o(this,x,"f"),ee=z?z[0]:l.right-l.left,te=z?z[1]:l.bottom-l.top;W.set(k,new Zt(o(this,M,"f"),ee,te,De,s[_].float))}else S.set(k,xr(o(this,M,"f"),le,Ie,{float:s[_].float}))}const A=[];for(let _=0;_<s.length;_++){const k=s[_],z=k.frag,le={...y},Ie={};for(const[ee,te]of S)ee!==k.target&&z.match(new RegExp(`uniform\\s+sampler2D\\s+${ee}\\b`))&&(le[ee]={value:te.texture});for(const[ee,te]of W)z.match(new RegExp(`uniform\\s+sampler2D\\s+${ee}\\b`))&&(le[ee]={value:te.texture});if(k.uniforms)for(const[ee,te]of Object.entries(k.uniforms))typeof te=="function"?(le[ee]={value:te()},Ie[ee]=te):le[ee]={value:te};const De=Is(o(this,M,"f"),{vertexShader:k.vert,fragmentShader:z,uniforms:le,renderingToBuffer:k.target!==void 0,glslVersion:k.glslVersion});A.push({pass:De,uniforms:le,uniformGenerators:{...T,...Ie},target:k.target,persistent:k.persistent,float:k.float,size:k.size,backbuffer:k.target?W.get(k.target):void 0})}const H=Date.now()/1e3,R={type:p,element:e,isInViewport:!1,isInLogicalViewport:!1,width:a.right-a.left,height:a.bottom-a.top,passes:A,bufferTargets:S,startTime:H,enterTime:H,leaveTime:Number.NEGATIVE_INFINITY,release:i.release??Number.POSITIVE_INFINITY,isGif:g,isFullScreen:f,overflow:c,intersection:h,originalOpacity:d,srcTexture:u,zIndex:i.zIndex??0,backbuffer:b,autoCrop:C};o(this,P,"m",Xi).call(this,R,a,H),o(this,Q,"f").push(R),o(this,Q,"f").sort((_,k)=>_.zIndex-k.zIndex)}async updateElementEffects(e,i){const r=o(this,Q,"f").find(l=>l.element===e);if(!r)throw new Error("[VFX-JS] updateElementEffects: element not registered");if(!r.chain)throw new Error("[VFX-JS] updateElementEffects: element is on the shader path; effect-only updates are not supported");const s=Array.isArray(i)?[...i]:[i],n=r.chain.effects,a=new Set(n),f=[];for(const l of s)if(!a.has(l)){if(o(this,ze,"f").has(l))throw new Error("[VFX-JS] Effect instance already attached. Construct a new instance per `vfx.add()` / `postEffect`.");f.push(l)}await r.chain.replaceEffects(s);const c=new Set(s);for(const l of n)c.has(l)||o(this,ze,"f").delete(l);for(const l of f)o(this,ze,"f").add(l)}removeElement(e){const i=o(this,Q,"f").findIndex(r=>r.element===e);if(i!==-1){const r=o(this,Q,"f").splice(i,1)[0];if(r.chain)o(this,P,"m",Ei).call(this,r.chain.effects),r.chain.dispose();else{for(const s of r.bufferTargets.values())s.dispose();for(const s of r.passes)s.pass.dispose(),s.backbuffer?.dispose();r.backbuffer?.dispose()}r.srcTexture.dispose(),e.style.setProperty("opacity",r.originalOpacity.toString())}}updateTextElement(e){const i=o(this,Q,"f").findIndex(r=>r.element===e);return i!==-1?o(this,P,"m",xi).call(this,o(this,Q,"f")[i]):Promise.resolve()}async updateImageElement(e){const i=o(this,Q,"f").find(a=>a.element===e);if(!i||i.type!=="img"||i.isGif)return;const r=await lr(e.src),s=i.srcTexture,n=new N(o(this,M,"f"),r);n.wrapS=s.wrapS,n.wrapT=s.wrapT,n.needsUpdate=!0,!i.chain&&i.passes.length>0&&(i.passes[0].uniforms.src.value=n),i.srcTexture=n,s.dispose()}updateCanvasElement(e){const i=o(this,Q,"f").find(r=>r.element===e);if(i){const r=i.srcTexture,s=new N(o(this,M,"f"),e);s.wrapS=r.wrapS,s.wrapT=r.wrapT,s.needsUpdate=!0,!i.chain&&i.passes.length>0&&(i.passes[0].uniforms.src.value=s),i.srcTexture=s,r.dispose()}}updateHICTexture(e,i){const r=o(this,Q,"f").find(n=>n.element===e);if(!r||r.type!=="hic")return;const s=r.srcTexture;if(s.source===i)s.needsUpdate=!0;else{const n=new N(o(this,M,"f"),i);n.wrapS=s.wrapS,n.wrapT=s.wrapT,n.needsUpdate=!0,!r.chain&&r.passes.length>0&&(r.passes[0].uniforms.src.value=n),r.srcTexture=n,s.dispose()}}get maxTextureSize(){return o(this,M,"f").maxTextureSize}isPlaying(){return o(this,Le,"f")!==void 0}play(){this.isPlaying()||L(this,Le,requestAnimationFrame(o(this,Ti,"f")),"f")}stop(){o(this,Le,"f")!==void 0&&(cancelAnimationFrame(o(this,Le,"f")),L(this,Le,void 0,"f"))}render(){const e=Date.now()/1e3,i=o(this,je,"f");o(this,P,"m",Vs).call(this),i.bindFramebuffer(i.FRAMEBUFFER,null),i.viewport(0,0,o(this,Ae,"f").width,o(this,Ae,"f").height),i.clear(i.COLOR_BUFFER_BIT);const r=o(this,re,"f").right-o(this,re,"f").left,s=o(this,re,"f").bottom-o(this,re,"f").top,n=wt(0,0,r,s),a=o(this,P,"m",Tr).call(this);a&&(o(this,P,"m",Ds).call(this,r,s),o(this,X,"f")&&(i.bindFramebuffer(i.FRAMEBUFFER,o(this,X,"f").fbo),i.clear(i.COLOR_BUFFER_BIT),i.bindFramebuffer(i.FRAMEBUFFER,null)));for(const f of o(this,Q,"f")){const c=f.element.getBoundingClientRect(),l=f.type==="text"?gr(c):mr(c),h=o(this,P,"m",Xi).call(this,f,l,e);if(!h.isVisible)continue;if(f.chain){o(this,P,"m",Bs).call(this,f,l,h,e);continue}const d=f.passes[0].uniforms;d.time.value=e-f.startTime,d.resolution.value.set((l.right-l.left)*o(this,x,"f"),(l.bottom-l.top)*o(this,x,"f")),d.mouse.value.set((o(this,Te,"f")+o(this,_e,"f"))*o(this,x,"f"),(o(this,Ee,"f")+o(this,xe,"f"))*o(this,x,"f"));for(const T of f.passes)for(const[b,S]of Object.entries(T.uniformGenerators))T.uniforms[b].value=S();Hi.get(f.element)?.update(),(f.type==="video"||f.isGif)&&(d.src.value.needsUpdate=!0);const u=ur(l,s,o(this,_e,"f"),o(this,xe,"f")),p=ur(h.rectWithOverflow,s,o(this,_e,"f"),o(this,xe,"f"));f.backbuffer&&(f.passes[0].uniforms.backbuffer.value=f.backbuffer.texture);{const T=f.isFullScreen?n:p,b=Math.max(1,T.w*o(this,x,"f")),S=Math.max(1,T.h*o(this,x,"f")),W=Math.max(1,T.w),A=Math.max(1,T.h);for(let H=0;H<f.passes.length-1;H++){const R=f.passes[H];if(!R.size)if(R.backbuffer)R.backbuffer.resize(W,A);else{const _=f.bufferTargets.get(R.target);_&&(_.width!==b||_.height!==S)&&_.setSize(b,S)}}}const g=new Map;for(const T of f.passes)T.backbuffer&&T.target&&g.set(T.target,T.backbuffer.texture);let w=f.srcTexture;const E=o(this,Te,"f")+o(this,_e,"f")-u.x,C=o(this,Ee,"f")+o(this,xe,"f")-u.y;for(let T=0;T<f.passes.length-1;T++){const b=f.passes[T],S=f.isFullScreen?n:p;b.uniforms.src.value=w;for(const[R,_]of g)b.uniforms[R]&&(b.uniforms[R].value=_);for(const[R,_]of Object.entries(b.uniformGenerators))b.uniforms[R]&&(b.uniforms[R].value=_());const W=b.size?b.size[0]:S.w*o(this,x,"f"),A=b.size?b.size[1]:S.h*o(this,x,"f"),H=b.size?wt(0,0,b.size[0],b.size[1]):wt(0,0,S.w,S.h);if(b.uniforms.resolution.value.set(W,A),b.uniforms.offset.value.set(0,0),b.uniforms.mouse.value.set(E/S.w*W,C/S.h*A),b.backbuffer)o(this,P,"m",ce).call(this,b.pass,b.backbuffer.target,H,b.uniforms,!0),b.backbuffer.swap(),w=b.backbuffer.texture;else{const R=f.bufferTargets.get(b.target);if(!R)continue;o(this,P,"m",ce).call(this,b.pass,R,H,b.uniforms,!0),w=R.texture}b.target&&g.set(b.target,w)}const y=f.passes[f.passes.length-1];y.uniforms.src.value=w,y.uniforms.resolution.value.set(c.width*o(this,x,"f"),c.height*o(this,x,"f")),y.uniforms.offset.value.set(u.x*o(this,x,"f"),u.y*o(this,x,"f")),y.uniforms.mouse.value.set((o(this,Te,"f")+o(this,_e,"f"))*o(this,x,"f"),(o(this,Ee,"f")+o(this,xe,"f"))*o(this,x,"f"));for(const[T,b]of g)y.uniforms[T]&&(y.uniforms[T].value=b);for(const[T,b]of Object.entries(y.uniformGenerators))y.uniforms[T]&&(y.uniforms[T].value=b());f.backbuffer?(y.uniforms.backbuffer.value=f.backbuffer.texture,f.isFullScreen?(f.backbuffer.resize(r,s),o(this,P,"m",Si).call(this,f,u.x,u.y),o(this,P,"m",ce).call(this,y.pass,f.backbuffer.target,n,y.uniforms,!0),f.backbuffer.swap(),o(this,fe,"f").setUniforms(f.backbuffer.texture,o(this,x,"f"),n),o(this,P,"m",ce).call(this,o(this,fe,"f").pass,a&&o(this,X,"f")||null,n,o(this,fe,"f").uniforms,!1)):(f.backbuffer.resize(p.w,p.h),o(this,P,"m",Si).call(this,f,f.overflow.left,f.overflow.bottom),o(this,P,"m",ce).call(this,y.pass,f.backbuffer.target,f.backbuffer.getViewport(),y.uniforms,!0),f.backbuffer.swap(),o(this,fe,"f").setUniforms(f.backbuffer.texture,o(this,x,"f"),p),o(this,P,"m",ce).call(this,o(this,fe,"f").pass,a&&o(this,X,"f")||null,p,o(this,fe,"f").uniforms,!1))):(o(this,P,"m",Si).call(this,f,u.x,u.y),o(this,P,"m",ce).call(this,y.pass,a&&o(this,X,"f")||null,f.isFullScreen?n:p,y.uniforms,!1))}a&&o(this,X,"f")&&(o(this,ne,"f")&&o(this,Qe,"f")?o(this,P,"m",zs).call(this,n,e):o(this,P,"m",Os).call(this,n,e))}}Ce=new WeakMap,Ae=new WeakMap,M=new WeakMap,je=new WeakMap,Ke=new WeakMap,_t=new WeakMap,fe=new WeakMap,ae=new WeakMap,X=new WeakMap,gt=new WeakMap,ne=new WeakMap,Qe=new WeakMap,ze=new WeakMap,Wt=new WeakMap,bi=new WeakMap,zt=new WeakMap,Le=new WeakMap,x=new WeakMap,Q=new WeakMap,Ot=new WeakMap,re=new WeakMap,Dt=new WeakMap,qe=new WeakMap,_e=new WeakMap,xe=new WeakMap,Te=new WeakMap,Ee=new WeakMap,Xt=new WeakMap,Ht=new WeakMap,_i=new WeakMap,Ti=new WeakMap,P=new WeakSet,Vs=function(){if(typeof window>"u")return;const e=o(this,Ae,"f").ownerDocument,i=e.compatMode==="BackCompat"?e.body:e.documentElement,r=i.clientWidth,s=i.clientHeight,n=window.scrollX,a=window.scrollY;let f,c;if(o(this,Ce,"f").fixedCanvas)f=0,c=0;else if(o(this,Ce,"f").wrapper)f=r*o(this,Ce,"f").scrollPadding[0],c=s*o(this,Ce,"f").scrollPadding[1];else{const d=e.body.scrollWidth-(n+r),u=e.body.scrollHeight-(a+s);f=ss(r*o(this,Ce,"f").scrollPadding[0],0,d),c=ss(s*o(this,Ce,"f").scrollPadding[1],0,u)}const l=r+f*2,h=s+c*2;(l!==o(this,qe,"f")[0]||h!==o(this,qe,"f")[1])&&(o(this,Ae,"f").style.width=`${l}px`,o(this,Ae,"f").style.height=`${h}px`,o(this,M,"f").setSize(l,h,o(this,x,"f")),L(this,re,Li({top:-c,left:-f,right:r+f,bottom:s+c}),"f"),L(this,Dt,Li({top:0,left:0,right:r,bottom:s}),"f"),L(this,qe,[l,h],"f"),L(this,_e,f,"f"),L(this,xe,c,"f")),o(this,Ce,"f").fixedCanvas||o(this,Ae,"f").style.setProperty("transform",`translate(${n-f}px, ${a-c}px)`)},xi=async function(e){if(!o(this,Xt,"f").get(e.element)){o(this,Xt,"f").set(e.element,!0);try{const i=e.srcTexture,r=i.source instanceof OffscreenCanvas?i.source:void 0,s=await dr(e.element,e.originalOpacity,r,this.maxTextureSize);if(s.width===0||s.width===0)throw"omg";const n=new N(o(this,M,"f"),s);n.wrapS=i.wrapS,n.wrapT=i.wrapT,n.needsUpdate=!0,!e.chain&&e.passes.length>0&&(e.passes[0].uniforms.src.value=n),e.srcTexture=n,i.dispose()}catch(i){console.error(i)}o(this,Xt,"f").set(e.element,!1)}},Ls=async function(e,i,r,s){i.shader!==void 0&&console.warn("[VFX-JS] Both `shader` and `effect` specified; `effect` takes precedence."),i.overflow!==void 0&&console.warn("[VFX-JS] `overflow` is shader-path only and is ignored by the effect path. Use each effect's own `outputRect` (with `dims.canvasRect` for fullscreen) to control its dst rect.");const n=Array.isArray(r)?[...r]:[r];o(this,P,"m",Qi).call(this,n);const a=e.getBoundingClientRect(),f=$s(e)?gr(a):mr(a),[c,l]=Hs(i.overflow),h=Ns(i.intersection),d=e.style.opacity===""?1:Number.parseFloat(e.style.opacity);let u,p,g=!1;if(e instanceof HTMLImageElement)if(p="img",g=!!e.src.match(/\.gif/i),g){const R=await $i.create(e.src,o(this,x,"f"));Hi.set(e,R),u=new N(o(this,M,"f"),R.getCanvas())}else{const R=await lr(e.src);u=new N(o(this,M,"f"),R)}else if(e instanceof HTMLVideoElement)u=new N(o(this,M,"f"),e),p="video";else if(e instanceof HTMLCanvasElement)e.hasAttribute("layoutsubtree")&&s?(u=new N(o(this,M,"f"),s),p="hic"):(u=new N(o(this,M,"f"),e),p="canvas");else{const R=await dr(e,d,void 0,this.maxTextureSize);u=new N(o(this,M,"f"),R),p="text"}const[w,E]=Gs(i.wrap);u.wrapS=w,u.wrapT=E,u.needsUpdate=!0;const C=i.autoCrop??!0;if(p!=="hic"){if(i.overlay!==!0)if(typeof i.overlay=="number")e.style.setProperty("opacity",i.overlay.toString());else{const R=p==="video"?"0.0001":"0";e.style.setProperty("opacity",R.toString())}}const y=Date.now()/1e3,T={type:p,element:e,isInViewport:!1,isInLogicalViewport:!1,width:f.right-f.left,height:f.bottom-f.top,passes:[],bufferTargets:new Map,startTime:y,enterTime:y,leaveTime:Number.NEGATIVE_INFINITY,release:i.release??Number.POSITIVE_INFINITY,isGif:g,isFullScreen:c,overflow:l,intersection:h,originalOpacity:d,srcTexture:u,zIndex:i.zIndex??0,backbuffer:void 0,autoCrop:C,effectLastRenderTime:y},b=Vi(()=>T.srcTexture,()=>rs(T.srcTexture,"w"),()=>rs(T.srcTexture,"h")),S={},W={};if(i.uniforms)for(const[R,_]of Object.entries(i.uniforms))typeof _=="function"?(W[R]=_,S[R]=_()):S[R]=_;T.effectUniformGenerators=W,T.effectStaticUniforms=S;const A={autoCrop:C,glslVersion:i.glslVersion??"300 es"},H=new Zr(o(this,M,"f"),o(this,Ke,"f"),o(this,x,"f"),n,A,b,!1,o(this,_t,"f"));try{await H.initAll()}catch(R){throw o(this,P,"m",Ei).call(this,n),u.dispose(),e.style.setProperty("opacity",d.toString()),R}T.chain=H,o(this,P,"m",Xi).call(this,T,f,y),o(this,Q,"f").push(T),o(this,Q,"f").sort((R,_)=>R.zIndex-_.zIndex)},Us=function(e){const i=s=>s.glslVersion===void 0&&e.glslVersion!==void 0?{...s,glslVersion:e.glslVersion}:s;if(Array.isArray(e.shader))return e.shader.map(i);const r=o(this,P,"m",Zi).call(this,e.shader||"uvGradient");return[i({frag:r})]},Bs=function(e,i,r,s){const n=e.chain;if(!n)return;const a=o(this,x,"f");Hi.get(e.element)?.update(),(e.type==="video"||e.isGif)&&(e.srcTexture.needsUpdate=!0);const f={...e.effectStaticUniforms??{}};if(e.effectUniformGenerators)for(const[T,b]of Object.entries(e.effectUniformGenerators))f[T]=b();const c=o(this,re,"f").right-o(this,re,"f").left,l=o(this,re,"f").bottom-o(this,re,"f").top,h=ur(i,l,o(this,_e,"f"),o(this,xe,"f")),d=o(this,Te,"f")+o(this,_e,"f")-h.x,u=o(this,Ee,"f")+o(this,xe,"f")-h.y,p=i.right-i.left,g=i.bottom-i.top,w=e.effectLastRenderTime??s,E=s-w;e.effectLastRenderTime=s;const y=o(this,P,"m",Tr).call(this)&&o(this,X,"f")?Cs(o(this,X,"f")):null;n.run({time:s-e.startTime,deltaTime:E,mouse:[d*a,u*a],mouseViewport:[o(this,Te,"f")*a,o(this,Ee,"f")*a],intersection:r.intersection,enterTime:s-e.enterTime,leaveTime:s-e.leaveTime,resolvedUniforms:f,canvasSize:[c,l],canvasBufferSize:[c*a,l*a],elementSize:[p,g],elementBufferSize:[p*a,g*a],elementRectOnCanvasPx:{x:h.x*a,y:h.y*a,w:h.w*a,h:h.h*a},finalTarget:y,isVisible:r.isVisible})},Tr=function(){return o(this,ae,"f").length>0||o(this,ne,"f")!==null&&o(this,Qe,"f")},Qi=function(e){for(const i of e)if(o(this,ze,"f").has(i))throw new Error("[VFX-JS] Effect instance already attached. Construct a new instance per `vfx.add()` / `postEffect`.");for(const i of e)o(this,ze,"f").add(i)},Ei=function(e){for(const i of e)o(this,ze,"f").delete(i)},ts=function(e){const i=e.hitTestPadBuffer,r=o(this,x,"f");return ti({top:i.top/r,right:i.right/r,bottom:i.bottom/r,left:i.left/r})},Xi=function(e,i,r){const s=e.chain?o(this,P,"m",ts).call(this,e.chain):e.overflow,n=vr(i,s),a=e.isFullScreen||Xs(o(this,Dt,"f"),n),f=vr(o(this,Dt,"f"),e.intersection.rootMargin),c=Oo(f,i),l=e.isFullScreen||en(f,i,c,e.intersection.threshold);!e.isInLogicalViewport&&l&&(e.enterTime=r,e.leaveTime=Number.POSITIVE_INFINITY),e.isInLogicalViewport&&!l&&(e.leaveTime=r),e.isInViewport=a,e.isInLogicalViewport=l;const h=a&&r-e.leaveTime<=e.release;if(h&&!e.chain&&e.passes.length>0){const d=e.passes[0].uniforms;d.intersection.value=c,d.enterTime.value=r-e.enterTime,d.leaveTime.value=r-e.leaveTime}return{isVisible:h,intersection:c,rectWithOverflow:n}},Zi=function(e){return e in Wr?Wr[e]:e},ce=function(e,i,r,s,n){const a=o(this,je,"f");n&&i!==null&&i!==o(this,X,"f")&&(a.bindFramebuffer(a.FRAMEBUFFER,i.fbo),a.viewport(0,0,i.width,i.height),a.clear(a.COLOR_BUFFER_BIT));const f=s.viewport;f&&f.value instanceof ei&&f.value.set(r.x*o(this,x,"f"),r.y*o(this,x,"f"),r.w*o(this,x,"f"),r.h*o(this,x,"f"));try{wo(a,o(this,Ke,"f"),e,i,r,o(this,qe,"f")[0],o(this,qe,"f")[1],o(this,x,"f"))}catch(c){console.error(c)}},Si=function(e,i,r){const s=e.passes[0].uniforms.offset.value;s.x=i*o(this,x,"f"),s.y=r*o(this,x,"f")},Ws=function(e){const i=e.length===1&&!("frag"in e[0])?e[0]:null;if(i&&i.effect!==void 0){o(this,P,"m",is).call(this,i,i.effect);return}const r=[],s=[];for(const a of e)"frag"in a&&s.push(a);for(let a=0;a<s.length-1;a++)s[a].target||(s[a]={...s[a],target:`pass${a}`});for(const a of e){let f,c,l;if("frag"in a)f=a.frag,c=new es(o(this,M,"f"),f,a.uniforms,a.persistent??!1,a.float??!1,a.size,a.target!==void 0,a.glslVersion),l=a.target;else{if(a.shader===void 0)throw new Error("VFXPostEffect requires `shader` (the `effect` path is not implemented yet).");f=o(this,P,"m",Zi).call(this,a.shader),c=new es(o(this,M,"f"),f,a.uniforms,a.persistent??!1,a.float??!1,void 0,!1,a.glslVersion),a.persistent&&c.registerBufferUniform("backbuffer"),l=void 0}r.push(f);const h={};if(a.uniforms)for(const[d,u]of Object.entries(a.uniforms))typeof u=="function"&&(h[d]=u);o(this,ae,"f").push({pass:c,target:l,generators:h})}for(const a of s)a.target&&o(this,gt,"f").set(a.target,void 0);const n=o(this,ae,"f").map(a=>a.target).filter(a=>a!==void 0);for(let a=0;a<o(this,ae,"f").length;a++)for(const f of n)r[a].match(new RegExp(`uniform\\s+sampler2D\\s+${f}\\b`))&&o(this,ae,"f")[a].pass.registerBufferUniform(f)},is=function(e,i){e.shader!==void 0&&console.warn("[VFX-JS] Both `shader` and `effect` specified on post-effect; `effect` takes precedence.");const r=Array.isArray(i)?[...i]:[i];o(this,P,"m",Qi).call(this,r);const s=Vi(()=>{const f=o(this,X,"f");if(!f)throw new Error("[VFX-JS] post-effect chain active without target");return f.texture},()=>o(this,X,"f")?.width??0,()=>o(this,X,"f")?.height??0),n={autoCrop:!0,glslVersion:e.glslVersion??"300 es"},a=new Zr(o(this,M,"f"),o(this,Ke,"f"),o(this,x,"f"),r,n,s,!0,o(this,_t,"f"));if(e.uniforms)for(const[f,c]of Object.entries(e.uniforms))typeof c=="function"?(o(this,bi,"f")[f]=c,o(this,Wt,"f")[f]=c()):o(this,Wt,"f")[f]=c;L(this,ne,a,"f"),L(this,zt,Date.now()/1e3,"f"),a.initAll().then(()=>{o(this,ne,"f")===a&&L(this,Qe,!0,"f")}).catch(f=>{console.error("[VFX-JS] Post-effect init failed; post-effect disabled:",f),o(this,ne,"f")===a&&(o(this,P,"m",Ei).call(this,o(this,ne,"f").effects),o(this,ne,"f").dispose(),L(this,ne,null,"f"),L(this,Qe,!1,"f"))})},zs=function(e,i){const r=o(this,ne,"f");if(!r)return;const s=o(this,x,"f"),n={...o(this,Wt,"f")};for(const[p,g]of Object.entries(o(this,bi,"f")))n[p]=g();const a=o(this,re,"f").right-o(this,re,"f").left,f=o(this,re,"f").bottom-o(this,re,"f").top,c=o(this,zt,"f"),l=i-c;L(this,zt,i,"f");const h=[a,f],d=[a*s,f*s],u={x:e.x*s,y:e.y*s,w:e.w*s,h:e.h*s};r.run({time:i-o(this,Ot,"f"),deltaTime:l,mouse:[o(this,Te,"f")*s,o(this,Ee,"f")*s],mouseViewport:[o(this,Te,"f")*s,o(this,Ee,"f")*s],intersection:1,enterTime:0,leaveTime:0,resolvedUniforms:n,canvasSize:h,canvasBufferSize:d,elementSize:h,elementBufferSize:d,elementRectOnCanvasPx:u,finalTarget:null,isVisible:!0})},Os=function(e,i){if(!o(this,X,"f"))return;let r=o(this,X,"f").texture;const s=new Map;for(const{pass:n,target:a}of o(this,ae,"f"))a&&n.backbuffer&&s.set(a,n.backbuffer.texture);for(let n=0;n<o(this,ae,"f").length;n++){const{pass:a,target:f,generators:c}=o(this,ae,"f")[n],l=n===o(this,ae,"f").length-1,h=o(this,Te,"f")+o(this,_e,"f"),d=o(this,Ee,"f")+o(this,xe,"f"),u=a.size;if(u){const[p,g]=u;a.uniforms.src.value=r,a.uniforms.resolution.value.set(p,g),a.uniforms.offset.value.set(0,0),a.uniforms.time.value=i-o(this,Ot,"f"),a.uniforms.mouse.value.set(h/e.w*p,d/e.h*g)}else a.setUniforms(r,o(this,x,"f"),e,i-o(this,Ot,"f"),h,d);a.uniforms.passIndex.value=n,a.updateCustomUniforms(c);for(const[p,g]of s){const w=a.uniforms[p];w&&(w.value=g)}if(l)a.backbuffer?(a.uniforms.backbuffer&&(a.uniforms.backbuffer.value=a.backbuffer.texture),o(this,P,"m",ce).call(this,a.pass,a.backbuffer.target,e,a.uniforms,!0),a.backbuffer.swap(),o(this,fe,"f").setUniforms(a.backbuffer.texture,o(this,x,"f"),e),o(this,P,"m",ce).call(this,o(this,fe,"f").pass,null,e,o(this,fe,"f").uniforms,!1)):o(this,P,"m",ce).call(this,a.pass,null,e,a.uniforms,!1);else if(a.backbuffer){a.uniforms.backbuffer&&(a.uniforms.backbuffer.value=a.backbuffer.texture);const p=u?wt(0,0,u[0]/o(this,x,"f"),u[1]/o(this,x,"f")):e;o(this,P,"m",ce).call(this,a.pass,a.backbuffer.target,p,a.uniforms,!0),a.backbuffer.swap(),r=a.backbuffer.texture,f&&s.set(f,a.backbuffer.texture)}else{const p=f??`postEffect${n}`;let g=o(this,gt,"f").get(p);const w=u?u[0]:e.w*o(this,x,"f"),E=u?u[1]:e.h*o(this,x,"f");(!g||g.width!==w||g.height!==E)&&(g?.dispose(),g=xr(o(this,M,"f"),w,E,{float:a.float}),o(this,gt,"f").set(p,g));const C=u?wt(0,0,u[0]/o(this,x,"f"),u[1]/o(this,x,"f")):e;o(this,P,"m",ce).call(this,a.pass,g,C,a.uniforms,!0),r=g.texture,f&&s.set(f,g.texture)}}},Ds=function(e,i){const r=e*o(this,x,"f"),s=i*o(this,x,"f");(!o(this,X,"f")||o(this,X,"f").width!==r||o(this,X,"f").height!==s)&&(o(this,X,"f")?.dispose(),L(this,X,xr(o(this,M,"f"),r,s),"f"));for(const{pass:n}of o(this,ae,"f"))n.persistent&&!n.backbuffer?n.initializeBackbuffer(o(this,M,"f"),e,i,o(this,x,"f")):n.backbuffer&&n.resizeBackbuffer(e,i)};function Xs(t,e){return e.left<=t.right&&e.right>=t.left&&e.top<=t.bottom&&e.bottom>=t.top}function en(t,e,i,r){return r===0?Xs(t,e):i>=r}function Hs(t){return t===!0?[!0,Yr]:t===void 0?[!1,Yr]:[!1,ti(t)]}function Ns(t){const e=t?.threshold??0,i=ti(t?.rootMargin??0);return{threshold:e,rootMargin:i}}function rs(t,e){const i=t.source;if(!i)return 0;if(typeof HTMLImageElement<"u"&&i instanceof HTMLImageElement)return e==="w"?i.naturalWidth:i.naturalHeight;if(typeof HTMLVideoElement<"u"&&i instanceof HTMLVideoElement)return e==="w"?i.videoWidth:i.videoHeight;const r=i;return e==="w"?r.width:r.height}function er(t){return t==="repeat"?"repeat":t==="mirror"?"mirror":"clamp"}function Gs(t){if(!t)return["clamp","clamp"];if(Array.isArray(t))return[er(t[0]),er(t[1])];const e=er(t);return[e,e]}function ss(t,e,i){return Math.max(e,Math.min(i,t))}function $s(t){return!(t instanceof HTMLImageElement||t instanceof HTMLVideoElement||t instanceof HTMLCanvasElement)}function tn(){try{const t=document.createElement("canvas");return(t.getContext("webgl2")||t.getContext("webgl"))!==null}catch{return!1}}var os=function(t,e,i,r,s){if(r==="m")throw new TypeError("Private method is not writable");if(r==="a"&&!s)throw new TypeError("Private accessor was defined without a setter");if(typeof e=="function"?t!==e||!s:!e.has(t))throw new TypeError("Cannot write private member to an object whose class did not declare it");return r==="a"?s.call(t,i):s?s.value=i:e.set(t,i),i},F=function(t,e,i,r){if(i==="a"&&!r)throw new TypeError("Private accessor was defined without a getter");if(typeof e=="function"?t!==e||!r:!e.has(t))throw new TypeError("Cannot read private member from an object whose class did not declare it");return i==="m"?r:i==="a"?r.call(t):r?r.value:e.get(t)},ft,V,Pi,Pe,qs,js,Js,Ys;function rn(){if(typeof window>"u")throw"Cannot find 'window'. VFX-JS only runs on the browser.";if(typeof document>"u")throw"Cannot find 'document'. VFX-JS only runs on the browser."}function sn(t){return{position:t?"fixed":"absolute",top:0,left:0,width:"0px",height:"0px","z-index":9999,"pointer-events":"none"}}class Ar{static init(e){try{return new Ar(e)}catch{return null}}constructor(e={}){if(ft.add(this),V.set(this,void 0),Pi.set(this,void 0),Pe.set(this,new Map),rn(),!tn())throw new Error("[VFX-JS] WebGL is not available in this environment.");const i=po(e),r=document.createElement("canvas"),s=sn(i.fixedCanvas);for(const[n,a]of Object.entries(s))r.style.setProperty(n,a.toString());i.zIndex!==void 0&&r.style.setProperty("z-index",i.zIndex.toString()),(i.wrapper??document.body).appendChild(r),os(this,Pi,r,"f"),os(this,V,new Zo(i,r),"f"),i.autoplay&&F(this,V,"f").play()}async add(e,i,r){e instanceof HTMLImageElement?await F(this,ft,"m",qs).call(this,e,i):e instanceof HTMLVideoElement?await F(this,ft,"m",js).call(this,e,i):e instanceof HTMLCanvasElement?e.hasAttribute("layoutsubtree")&&r?await F(this,V,"f").addElement(e,i,r):await F(this,ft,"m",Js).call(this,e,i):await F(this,ft,"m",Ys).call(this,e,i)}updateHICTexture(e,i){F(this,V,"f").updateHICTexture(e,i)}get maxTextureSize(){return F(this,V,"f").maxTextureSize}async addHTML(e,i){if(!ho())return console.warn("html-in-canvas not supported, falling back to dom-to-canvas"),this.add(e,i);i.overlay!==void 0&&console.warn("addHTML does not support overlay mode (layoutsubtree hides children). Ignoring overlay option.");const{overlay:r,...s}=i;let n=F(this,Pe,"f").get(e);n&&F(this,V,"f").removeElement(n);const{canvas:a,initialCapture:f}=await uo(e,{onCapture:c=>{F(this,V,"f").updateHICTexture(a,c)},maxSize:F(this,V,"f").maxTextureSize});n=a,F(this,Pe,"f").set(e,n),await F(this,V,"f").addElement(n,s,f)}remove(e){const i=F(this,Pe,"f").get(e);i?(zr(i,e),F(this,Pe,"f").delete(e),F(this,V,"f").removeElement(i)):F(this,V,"f").removeElement(e)}updateEffects(e,i){const r=F(this,Pe,"f").get(e)??e;return F(this,V,"f").updateElementEffects(r,i)}async update(e){const i=F(this,Pe,"f").get(e);if(i){i.requestPaint();return}if(e instanceof HTMLImageElement)return F(this,V,"f").updateImageElement(e);if(e instanceof HTMLCanvasElement){F(this,V,"f").updateCanvasElement(e);return}else return F(this,V,"f").updateTextElement(e)}play(){F(this,V,"f").play()}stop(){F(this,V,"f").stop()}render(){F(this,V,"f").render()}destroy(){for(const[e,i]of F(this,Pe,"f"))zr(i,e);F(this,Pe,"f").clear(),F(this,V,"f").destroy(),F(this,Pi,"f").remove()}}V=new WeakMap,Pi=new WeakMap,Pe=new WeakMap,ft=new WeakSet,qs=function(e,i){return e.complete?F(this,V,"f").addElement(e,i):new Promise(r=>{e.addEventListener("load",()=>{F(this,V,"f").addElement(e,i),r()},{once:!0})})},js=function(e,i){return e.readyState>=3?F(this,V,"f").addElement(e,i):new Promise(r=>{e.addEventListener("canplay",()=>{F(this,V,"f").addElement(e,i),r()},{once:!0})})},Js=function(e,i){return F(this,V,"f").addElement(e,i)},Ys=function(e,i){return F(this,V,"f").addElement(e,i)};const on={color:"#3366DD",angle:45,spacing:2.5,lineWidth:2,angleJitter:.5,offsetJitter:2,spacingJitter:.5,seed:0,speed:8,roundCap:!0,soft:0,originalColor:!0,bypass:!1},nn=t=>{const e=t.replace("#","");return[0,2,4].map(i=>Number.parseInt(e.substring(i,i+2),16)/255)},ns=`#version 300 es
precision highp float;
in vec2 uvSrc;
out vec4 outColor;
uniform sampler2D src;
uniform vec2  resolution;
uniform float pixelRatio;
uniform vec3  color;
uniform float angle;
uniform float spacing;
uniform float lineWidth;
uniform float angleJitter;
uniform float offsetJitter;
uniform float spacingJitter;
uniform float seed;
uniform float speed;
uniform float time;
uniform float roundCap;
uniform float soft;
uniform float originalColor;
uniform float bypass;

float hash(float n) { return fract(sin(n * 127.1) * 43758.5453123); }

float covAt(vec2 p) {
  return texture(src, (p + resolution * 0.5) / resolution).a;
}

vec3 colAt(vec2 p) {
  vec4 t = texture(src, (p + resolution * 0.5) / resolution);
  return t.a > 0.004 ? t.rgb / t.a : t.rgb;
}

void main() {
  if (bypass > 0.5) {
    outColor = texture(src, uvSrc); return;
  }

  vec2  px = uvSrc * resolution - resolution * 0.5;
  float sp = max(spacing * pixelRatio, 1.0);
  float lw = lineWidth * pixelRatio;
  float hw = lw * 0.5;
  float aa = mix(0.6, 2.5, soft);
  float oj = offsetJitter * pixelRatio;
  float sj = spacingJitter * pixelRatio;

  float angleRad  = radians(angle);
  float jitterRad = radians(angleJitter);

  vec2  nor     = vec2(-sin(angleRad), cos(angleRad));
  vec2  baseDir = vec2( cos(angleRad), sin(angleRad));
  float baseIndex = floor(dot(px, nor) / sp);

  float realSeed = seed + hash(floor(time * speed)) * 100.0;

  float extent = dot(abs(baseDir), resolution);
  float jitterFrac = clamp(jitterRad / radians(10.0), 0.0, 1.0);
  int   K = clamp(int(ceil(extent * tan(jitterRad) / sp)) + 2, 3, 24);

  float ink = 0.0;
  vec3  strokeCol = color;
  for (int k = -K; k <= K; k++) {
    float idx = baseIndex + float(k);
    float a   = angleRad + (hash(idx * 1.37 + realSeed) - 0.5) * jitterRad;
    float sa = sin(a), ca = cos(a);
    vec2  n2  = vec2(-sa, ca);
    vec2  dir = vec2( ca, sa);

    float center = (idx + 0.5) * sp + (hash(idx * 3.91 + realSeed) - 0.5) * 2.0 * sj;
    float u  = hash(idx * 7.13 + realSeed) * 2.0 - 1.0;
    vec2  Pp = nor * center + baseDir * (u * jitterFrac * 0.5 * extent);
    float dperp = dot(px - Pp, n2);

    if (abs(dperp) > hw + aa) { continue; }

    float s    = (hash(idx * 5.23 + realSeed) - 0.5) * 2.0 * oj;
    vec2  foot = px - dperp * n2;
    vec2  base = foot - s * dir;

    float ink_k;
    vec2  cpoint = base;
    if (roundCap > 0.5) {
      float g = -1.0, gOff = 0.0;
      float c0 = covAt(base);
      if (c0 > 0.5) {
        g = 0.0;
      } else {
        float pp = c0, pn = c0;
        for (int t = 1; t <= 24; t++) {
          float off = float(t);
          if (off > hw + aa) break;
          float cp = covAt(base + off * dir);
          float cn = covAt(base - off * dir);
          if (cp > 0.5) { float gg = off - (cp - 0.5) / max(cp - pp, 1e-3); g = gg; gOff =  gg; break; }
          if (cn > 0.5) { float gg = off - (cn - 0.5) / max(cn - pn, 1e-3); g = gg; gOff = -gg; break; }
          pp = cp; pn = cn;
        }
      }
      if (g < 0.0) continue;
      float dist = sqrt(dperp * dperp + g * g);
      ink_k  = 1.0 - smoothstep(hw - aa, hw + aa, dist);
      cpoint = base + gOff * dir;
    } else {
      ink_k = (1.0 - smoothstep(hw - aa, hw + aa, abs(dperp))) * covAt(base);
    }

    if (ink_k > ink) {
      ink = ink_k;
      strokeCol = (originalColor > 0.5) ? colAt(cpoint) : color;
    }
  }

  outColor = vec4(strokeCol * ink, ink);
}
`,an=`#version 300 es
precision highp float;
in vec2 uv;
out vec4 outColor;
uniform sampler2D frozen;
void main() { outColor = texture(frozen, uv); }
`;class fn{params;_lastStep=-1;rt=null;constructor(e={}){this.params={...on,...e}}setParams(e){Object.assign(this.params,e)}render(e){const i=this.params,[r,s]=e.dims.elementPixel,n={src:e.src,resolution:[r,s],pixelRatio:e.dims.pixelRatio,color:nn(i.color),angle:i.angle,spacing:i.spacing,lineWidth:i.lineWidth,angleJitter:i.angleJitter,offsetJitter:i.offsetJitter,spacingJitter:i.spacingJitter,seed:i.seed,speed:i.speed,roundCap:i.roundCap?1:0,soft:i.soft,originalColor:i.originalColor?1:0,bypass:i.bypass?1:0,time:e.time};if(i.speed<=0){e.draw({frag:ns,uniforms:n,target:e.target});return}this.rt||(this.rt=e.createRenderTarget({persistent:!0}),this._lastStep=-1);const a=Math.floor(e.time*i.speed);a!==this._lastStep&&(this._lastStep=a,e.draw({frag:ns,uniforms:n,target:this.rt})),e.draw({frag:an,uniforms:{frozen:this.rt},target:e.target})}dispose(){this.rt&&(this.rt.dispose(),this.rt=null),this._lastStep=-1}}Fi.registerPlugin(ls);let Ze=null,Jt=null,ct=null,Yt=null,Fe=null,G=null,Kt=0,Er=[],xt=[],kr=[],Ci=null,Ri=0,Ne=1,as=.6,Sr=null;function qi(){return window.matchMedia("(prefers-reduced-motion: reduce)").matches}function Ir(){return window.matchMedia("(max-width: 768px)").matches}function cn(){Jt&&(Jt.kill(),Jt=null),ls.getAll().forEach(t=>{String(t.vars.id||"").startsWith("home-motion-")&&t.kill()})}let Se=null;function ji(t){t.typeTimer!==null&&(window.clearTimeout(t.typeTimer),t.typeTimer=null),t.autoTimer!==null&&(window.clearTimeout(t.autoTimer),t.autoTimer=null)}function Vr(t,e){const i=e==="visitor"?"visitor":"host";t.els.name.textContent=t.cfg.speakers[i]||"",t.els.box.dataset.speaker=i}function Ks(t,e){ji(t),Vr(t,e.speaker),t.els.menu.hidden=!0,t.els.text.hidden=!1,t.els.text.textContent="",t.typing=!0,t.els.box.dataset.typing="true";const i=Array.from(e.text);let r=0;const s=()=>{if(!(!Se||Se!==t)){if(r>=i.length){t.typing=!1,t.els.box.dataset.typing="false",t.typeTimer=null,Lr(t);return}t.els.text.textContent+=i[r],r+=1,t.typeTimer=window.setTimeout(s,t.cfg.typingSpeed)}};s()}function ln(t){t.typing&&(ji(t),t.els.text.textContent=t.lines[t.lineIndex]?.text??"",t.typing=!1,t.els.box.dataset.typing="false",Lr(t))}function Lr(t){const e=t.lineIndex>=t.lines.length-1;t.els.advanceLabel&&(t.els.advanceLabel.textContent=e?"选择话题":"下一句"),t.els.footer&&(t.els.footer.dataset.end=e?"true":"false"),t.auto&&(t.autoTimer=window.setTimeout(()=>{Se===t&&Pr(t)},t.cfg.autoDelay))}function Ur(t){ji(t),t.mode="menu",t.typing=!1,t.els.box.dataset.typing="false",Vr(t,"host"),t.els.text.textContent=t.cfg.menuTitle,t.els.menu.innerHTML="",t.cfg.topics.forEach((e,i)=>{const r=document.createElement("li"),s=document.createElement("button");s.type="button",s.className="home-hero__dialogue-menu-item",s.textContent=e.title,s.addEventListener("click",n=>{n.stopPropagation(),un(t,i)}),r.appendChild(s),t.els.menu.appendChild(r)}),t.els.menu.hidden=t.cfg.topics.length===0,t.els.advanceLabel&&(t.els.advanceLabel.textContent="下一句"),t.els.footer&&(t.els.footer.dataset.end="false")}function un(t,e){const i=t.cfg.topics[e];i&&(t.mode="topic",t.topicIndex=e,t.lineIndex=0,t.lines=i.lines,t.els.menu.hidden=!0,Ks(t,t.lines[0]))}function Ni(t,e){t.lineIndex=e,Ks(t,t.lines[e])}function Pr(t){if(t.mode!=="menu"){if(t.typing){ln(t);return}t.lineIndex<t.lines.length-1?Ni(t,t.lineIndex+1):Ur(t)}}function hn(t){if(t.mode!=="menu"){if(t.lineIndex>0){Ni(t,t.lineIndex-1);return}t.mode==="topic"?Ur(t):Ni(t,0)}}function dn(t){t.auto=!t.auto,t.els.autoBtn?.setAttribute("aria-pressed",String(t.auto)),t.els.box.dataset.auto=String(t.auto),t.auto&&!t.typing&&t.mode!=="menu"?Lr(t):!t.auto&&t.autoTimer!==null&&(window.clearTimeout(t.autoTimer),t.autoTimer=null)}function tr(t,e){t.root.dataset.hidden=String(e),t.els.trigger&&(t.els.trigger.classList.toggle("home-hero__name-badge--dialogue-trigger",e),t.els.trigger.setAttribute("aria-expanded",String(!e))),e&&t.autoTimer!==null&&(window.clearTimeout(t.autoTimer),t.autoTimer=null);const i=document.getElementById("home-hero");i&&Cr(i)}function fs(t){t.started||(t.started=!0,t.cfg.intro.length>0?(t.mode="intro",t.lines=t.cfg.intro,Ni(t,0)):Ur(t))}function pn(){const t=document.getElementById("hero-dialogue");if(!t)return;let e=null;try{t.dataset.dialogue&&(e=JSON.parse(t.dataset.dialogue))}catch{e=null}if(!e)return;const i=t.querySelector("[data-dialogue-box]"),r=t.querySelector("[data-dialogue-name]"),s=t.querySelector("[data-dialogue-text]"),n=t.querySelector("[data-dialogue-menu]"),a=t.querySelector("[data-dialogue-click]");if(!i||!r||!s||!n||!a)return;Qs();const f={root:t,cfg:e,mode:"intro",topicIndex:0,lineIndex:0,lines:e.intro,typing:!1,auto:!1,typeTimer:null,autoTimer:null,started:!1,els:{box:i,name:r,text:s,menu:n,body:a,footer:t.querySelector(".home-hero__dialogue-footer"),advance:t.querySelector("[data-dialogue-advance]"),advanceLabel:t.querySelector("[data-dialogue-advance-label]"),autoBtn:t.querySelector('[data-dialogue-action="auto"]'),trigger:document.querySelector(".home-hero__name-badge")}};Se=f,a.addEventListener("click",()=>Pr(f)),f.els.advance?.addEventListener("click",c=>{c.stopPropagation(),Pr(f)}),t.querySelector('[data-dialogue-action="back"]')?.addEventListener("click",()=>hn(f)),f.els.autoBtn?.addEventListener("click",()=>dn(f)),t.querySelector('[data-dialogue-action="hide"]')?.addEventListener("click",()=>tr(f,!0)),f.els.trigger?.addEventListener("click",()=>{f.root.dataset.hidden==="true"&&tr(f,!1)}),Vr(f,"host"),tr(f,!1)}function Qs(){Se&&(ji(Se),Se=null)}async function mn(t,e){const i=document.querySelector(".home-hero__name");if(!i||qi()||(await t,e!==Ji||!document.contains(i)))return;Zs();const r=document.getElementById("home-hero")??void 0,s=Ar.init({pixelRatio:Math.min(window.devicePixelRatio,1.5),zIndex:10,wrapper:r});if(s){ct=s,Yt=new fn({color:"#ffffff",angle:45,spacing:2.5,lineWidth:2,angleJitter:.5,offsetJitter:2,spacingJitter:.5,seed:0,speed:8,roundCap:!0,soft:0,originalColor:!0,bypass:!1});try{await s.addHTML(i,{effect:Yt})}catch{}}}function Zs(){if(ct){const t=document.querySelector(".home-hero__name");if(t)try{ct.remove(t)}catch{}}Yt&&(Yt.dispose(),Yt=null),ct&&(ct.destroy(),ct=null)}function gn(t){const e=t.trim();if(!e)return null;const i=e.split(",").map(s=>Number.parseInt(s.trim(),10));if(i.length===3&&i.every(s=>Number.isFinite(s)&&s>=0&&s<=255))return i.join(", ");let r=e.replace(/^#/,"");if(r.length===3&&(r=r.split("").map(s=>s+s).join("")),r.length===6&&/^[0-9a-fA-F]{6}$/.test(r)){const s=Number.parseInt(r.slice(0,2),16),n=Number.parseInt(r.slice(2,4),16),a=Number.parseInt(r.slice(4,6),16);return`${s}, ${n}, ${a}`}return null}function vn(){return Sr||(document.documentElement.classList.contains("dark")?"255, 255, 255":"70, 78, 90")}function wn(t,e){if(!document.contains(t))return!1;let i=t;for(;i&&i!==e;){const s=window.getComputedStyle(i);if(s.display==="none"||s.visibility==="hidden")return!1;i=i.parentElement}const r=t.closest(".home-hero__dialogue");return!(r&&r.getAttribute("data-hidden")==="true")}function Cr(t){const e=t.getBoundingClientRect(),i=[],r=[".home-hero__viewfinder-corner",".home-hero__dialogue-box"];for(const s of r)t.querySelectorAll(s).forEach(n=>{if(!wn(n,t))return;const a=n.getBoundingClientRect();a.width<2||a.height<2||i.push({x1:a.left-e.left,x2:a.right-e.left,y:a.top-e.top})});kr=i}function cs(t,e){if(xt.length>90)return;const i=6+Math.floor(se()*4);for(let r=0;r<i;r++){const s=-Math.PI/2+(se()-.5)*1.9,n=1.1+se()*2.2;xt.push({x:t,y:e,vx:Math.cos(s)*n,vy:Math.sin(s)*n,life:0,maxLife:22+Math.floor(se()*16),r:.8+se()*1.1})}}let ir=20260710;function se(){return ir=(ir*1664525+1013904223)%4294967296,ir/4294967296}function yn(t,e,i){return{x:se()*t,y:se()*e,r:.9+se()*1.4,vy:2.4+se()*3.2,len:9+se()*16,alpha:.12+se()*.2}}function bn(){const t=document.getElementById("home-hero");if(!t||qi()||Ir())return;let e={enabled:!0,intensity:.6,color:""};try{t.dataset.heroRain&&(e={...e,...JSON.parse(t.dataset.heroRain)})}catch{}if(!e.enabled)return;as=Math.max(0,Math.min(1,e.intensity)),Sr=gn(e.color||""),eo();const i=document.createElement("canvas");i.className="home-hero__rain-canvas",i.setAttribute("aria-hidden","true"),t.appendChild(i);const r=i.getContext("2d");if(!r){i.remove();return}Fe=i,G=r,Ne=Math.min(window.devicePixelRatio||1,1.5);function s(){if(!Fe||!G||!t)return;const a=t.getBoundingClientRect();Fe.width=Math.round(a.width*Ne),Fe.height=Math.round(a.height*Ne),G.setTransform(Ne,0,0,Ne,0,0);const f=Math.round((20+as*40)*Math.min(1,a.width/1280));Er=Array.from({length:f},()=>yn(a.width,a.height)),Cr(t)}s(),Ci=s,window.addEventListener("resize",s),Ri=window.setInterval(()=>Cr(t),500);function n(){if(!Fe||!G)return;const a=Fe.width/Ne,f=Fe.height/Ne;G.clearRect(0,0,a,f);const c=vn();for(const l of Er){const h=l.y;l.y+=l.vy;let d=!1;for(const u of kr)if(h<u.y&&l.y>=u.y&&l.x>=u.x1&&l.x<=u.x2){cs(l.x,u.y),l.y=-se()*40,l.x=se()*a,d=!0;break}!d&&h<f&&l.y>=f&&(cs(l.x,f-1),l.y=-se()*40,l.x=se()*a),G.strokeStyle=`rgba(${c}, ${l.alpha})`,G.lineWidth=l.r,G.beginPath(),G.moveTo(l.x,l.y-l.len),G.lineTo(l.x,l.y),G.stroke(),G.fillStyle=`rgba(${c}, ${Math.min(.5,l.alpha+.18)})`,G.beginPath(),G.arc(l.x,l.y,l.r*.9,0,Math.PI*2),G.fill()}for(let l=xt.length-1;l>=0;l--){const h=xt[l];h.life++,h.vy+=.16,h.x+=h.vx,h.y+=h.vy;const d=1-h.life/h.maxLife;if(d<=0){xt.splice(l,1);continue}G.fillStyle=`rgba(${c}, ${.4*d})`,G.beginPath(),G.arc(h.x,h.y,h.r,0,Math.PI*2),G.fill()}Kt=requestAnimationFrame(n)}Kt=requestAnimationFrame(n)}function eo(){Kt&&(cancelAnimationFrame(Kt),Kt=0),Ri&&(window.clearInterval(Ri),Ri=0),Ci&&(window.removeEventListener("resize",Ci),Ci=null),Fe&&(Fe.remove(),Fe=null),G=null,Er=[],xt=[],kr=[]}function _n(){const t=document.getElementById("home-hero");if(!t)return Promise.resolve();if(qi()||Ir())return t.classList.remove("home-hero--motion-pending"),t.classList.add("home-hero--motion-ready"),Se&&fs(Se),Promise.resolve();const e=t.querySelector(".home-hero__occupation"),i=t.querySelector(".home-hero__name-badge"),r=t.querySelector(".home-hero__dialogue-box"),s=t.querySelector(".home-hero__right-panel"),n=t.querySelector(".home-hero__focus-frame"),a=t.querySelectorAll(".home-hero__viewfinder-corner"),f=t.querySelector(".home-hero__focus-dot"),c=t.querySelector(".home-hero__camera-params");t.classList.add("home-hero--motion-ready");const l=Promise.resolve();return Jt=Fi.timeline({defaults:{ease:"power4.out"}}),Jt.fromTo(a,{autoAlpha:0,scale:.3},{autoAlpha:1,scale:1,duration:.7,stagger:.08,ease:"expo.out"},.1).fromTo(n,{autoAlpha:0,scale:1.7},{autoAlpha:1,scale:1,duration:.85,ease:"expo.out"},.45).to(n,{scale:.9,duration:.2,ease:"power2.inOut"},"-=0.1").to(n,{scale:1,duration:.28,ease:"power2.out"}).fromTo(f,{autoAlpha:0,scale:0},{autoAlpha:1,scale:1,duration:.25,ease:"back.out(2.5)"},"-=0.05").fromTo(c,{autoAlpha:0,x:-16},{autoAlpha:1,x:0,duration:.6,ease:"expo.out"},.95).fromTo(e,{autoAlpha:0,y:48},{autoAlpha:1,y:0,duration:.92,ease:"expo.out"},.82).fromTo(i,{autoAlpha:0,y:18,scale:.7},{autoAlpha:1,y:0,scale:1,duration:.78,ease:"expo.out"},1.34).fromTo(s,{autoAlpha:0,x:60},{autoAlpha:1,x:0,duration:.95,ease:"power3.out"},1.66).fromTo(r,{autoAlpha:0,y:34,scale:.92,filter:"blur(10px)",transformOrigin:"50% 100%"},{autoAlpha:1,y:0,scale:1,filter:"blur(0px)",duration:.92,ease:"expo.out",clearProps:"filter",onComplete:()=>{Se&&fs(Se)}},2.12),t.classList.remove("home-hero--motion-pending"),l}function xn(){if(qi()||Ir()){document.querySelector(".home-page--motion-pending")?.classList.remove("home-page--motion-pending");return}Array.from(document.querySelectorAll(".home-page > :not(#home-hero), .home-pending-layer")).filter((e,i,r)=>r.indexOf(e)===i).forEach((e,i)=>{const r=e.querySelector(".home-section-title, [data-motion-title]"),s=e.querySelectorAll(".card-base, .post-card-wrapper, .home-pending, .stats-container, [data-motion-card]"),n=e.querySelectorAll("img[data-home-motion-image]:not([data-shutter-image]):not([data-shutter-final-midground]):not([data-shutter-final-foreground]), [data-home-motion-image]:not([data-shutter-image]):not([data-shutter-final-midground]):not([data-shutter-final-foreground])");if(!r&&s.length===0&&n.length===0)return;const a=Fi.timeline({scrollTrigger:{id:`home-motion-section-${i}`,trigger:e,start:"top 78%",once:!0},defaults:{ease:"power4.out"}});r&&a.fromTo(r,{autoAlpha:0,y:110,scale:.82,clipPath:"inset(0 0 100% 0)"},{autoAlpha:1,y:0,scale:1,clipPath:"inset(0 0 0% 0)",duration:1.05,ease:"expo.out"}),s.length>0&&a.fromTo(s,{autoAlpha:0,y:86,rotateX:12,filter:"blur(12px)",transformOrigin:"50% 100%"},{autoAlpha:1,y:0,rotateX:0,filter:"blur(0px)",duration:1.05,stagger:.12,ease:"expo.out"},r?"-=0.38":0),n.length>0&&(a.fromTo(n,{clipPath:"inset(0 0 100% 0)",scale:1.1},{clipPath:"inset(0 0 0% 0)",scale:1,duration:1.18,stagger:.1,ease:"expo.out"},"-=0.74"),n.forEach((f,c)=>{Fi.to(f,{yPercent:-5,ease:"none",scrollTrigger:{id:`home-motion-image-${i}-${c}`,trigger:f,start:"top bottom",end:"bottom top",scrub:.9}})}))}),document.querySelector(".home-page--motion-pending")?.classList.remove("home-page--motion-pending")}function Tn(){Ze&&(window.clearInterval(Ze),Ze=null);const t=document.getElementById("home-hero"),e=document.getElementById("hero-avatar"),i=document.getElementById("work-status"),r=i?.querySelector(".home-hero__status-text"),s=document.getElementById("hero-work-status-vertical");if(!t||!e||!i||!r)return;const n=t,a=e,f=i,c=r,l=n.dataset.workHours;let h={start:9,end:18,workDays:[1,2,3,4,5]};if(l)try{h=JSON.parse(l)}catch{}function d(){const u=new Date,p=u.getHours()+u.getMinutes()/60,g=u.getDay(),E=h.workDays.includes(g)&&p>=h.start&&p<h.end,C=E?n.dataset.avatar:n.dataset.avatarOff;C&&a.getAttribute("src")!==C&&a.setAttribute("src",C),c.textContent=E?"上班中":"下班",f.classList.toggle("is-off-work",!E),s&&(s.textContent=E?"WORKING":"OFF WORK",s.classList.toggle("is-working",E))}d(),Ze=window.setInterval(d,6e4)}function En(){Ze&&(window.clearInterval(Ze),Ze=null)}let Ji=0;function Sn(){Br();const t=Ji;pn();const e=_n();Tn(),mn(e,t),requestAnimationFrame(()=>{xn(),bn()})}function Br(){cn(),En(),Zs(),eo(),Qs()}async function to(){++Ji,Br(),document.getElementById("home-hero")&&(await io(),document.getElementById("home-hero")&&Sn())}to();document.addEventListener("astro:page-load",()=>{document.getElementById("home-hero")?to():(Ji+=1,Br())});
