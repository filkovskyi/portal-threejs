import './style.css'
import * as dat from 'lil-gui'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import { Points, sRGBEncoding } from 'three'

import firefliesVertexShader from './shaders/fireflies/vertex.glsl'
import firefliesFragmentShader from './shaders/fireflies/fragment.glsl'

import portalVertexShader from './shaders/portal/vertex.glsl'
import portalFragmentShader from './shaders/portal/fragment.glsl'

/**
 * Base
 */
// Debug
const debugObject = {
    sizes: 50
}
const gui = new dat.GUI({
    width: 400
})

// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()

/**
 * Loaders
 */
// Texture loader
const textureLoader = new THREE.TextureLoader()

// Draco loader
const dracoLoader = new DRACOLoader()
dracoLoader.setDecoderPath('draco/')

// GLTF loader
const gltfLoader = new GLTFLoader()
gltfLoader.setDRACOLoader(dracoLoader)

/**
 * Texture
 */
const bakedTexture = textureLoader.load('my-backed.jpg')
bakedTexture.flipY = false
bakedTexture.encoding = sRGBEncoding
/**
 * Materials
 */
const bakedMaterial = new THREE.MeshBasicMaterial({ map: bakedTexture })

const portalLightMaterial = new THREE.ShaderMaterial({
    uniforms: {
        uTime: { value: 0 },
        uColorStart: { value: new THREE.Color(debugObject.portalColorStart) },
        uColorEnd: { value: new THREE.Color(debugObject.portalColorEnd) },
    },
    vertexShader: portalVertexShader,
    fragmentShader: portalFragmentShader,
})

debugObject.portalColorStart = '#000000'
debugObject.portalColorEnd = '#ffffff'

gui
    .addColor(debugObject, 'portalColorStart')
    .onChange(() => {
        portalLightMaterial.uniforms.uColorStart.value.set(debugObject.portalColorStart)
    })

gui
    .addColor(debugObject, 'portalColorEnd')
    .onChange(() => {
        portalLightMaterial.uniforms.uColorEnd.value.set(debugObject.portalColorEnd)
    })

const poleLightMaterial = new THREE.MeshBasicMaterial({ color: 0xffffe5 })

/**
 * Models
 */
gltfLoader.load(
    'my-portal.glb',
    (gltf) => {
        const BackedAMesh = gltf.scene.children.find(child => child.name === 'Backed')

        const PoleLightAMesh = gltf.scene.children.find(child => child.name === 'PoleLightA')
        const PoleLightBMesh = gltf.scene.children.find(child => child.name === 'PoleLightB')
        const PortalLightMesh = gltf.scene.children.find(child => child.name === 'PortalLight')

        PoleLightAMesh.material = poleLightMaterial
        PoleLightBMesh.material = poleLightMaterial
        PortalLightMesh.material = portalLightMaterial

        BackedAMesh.material = bakedMaterial

        scene.add(gltf.scene)
    }
)

/**
 * Geometry
 */
const fireFliesGeometry = new THREE.BufferGeometry()

const fireFliesCount = 30
const fireFliesPositionArray = new Float32Array(fireFliesCount * 3)
const scaleArray = new Float32Array(fireFliesCount)
fireFliesGeometry.setAttribute('aScale', new THREE.BufferAttribute(scaleArray, 1))

for (let index = 0; index < fireFliesCount; index++) {
    fireFliesPositionArray[index * 3 + 0] = (Math.random() - 0.5) * 4;
    fireFliesPositionArray[index * 3 + 1] = Math.random() * 1.25;
    fireFliesPositionArray[index * 3 + 2] = (Math.random() - 0.5) * 4;

    scaleArray[index] = Math.random()
}

const fireFliesMaterial = new THREE.ShaderMaterial({
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false, 
    vertexShader: firefliesVertexShader,
    fragmentShader: firefliesFragmentShader,
    uniforms: {
        uTime: {
            value: 0
        },
        uPixelRation: {
            value: Math.min(window.devicePixelRatio, 2)
        },
        uSize: {
            value: debugObject.sizes
        }
    }
})

fireFliesGeometry.setAttribute('position', new THREE.BufferAttribute(fireFliesPositionArray, 3))

gui.add(fireFliesMaterial.uniforms.uSize, 'value').min(0).max(500).step(1).name('Fire Flies Size')

//Points
const fireFlies = new Points(fireFliesGeometry, fireFliesMaterial)
scene.add(fireFlies)




/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

window.addEventListener('resize', () => {
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

    fireFliesMaterial.uniforms.uPixelRation.value = Math.min(window.devicePixelRatio, 2)
})

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(45, sizes.width / sizes.height, 0.1, 100)
camera.position.x = 4
camera.position.y = 2
camera.position.z = 4
scene.add(camera)

// Controls
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.outputEncoding = sRGBEncoding

debugObject.clearColor = '#201915'
gui
    .addColor(debugObject, 'clearColor')
    .onChange(() => renderer.setClearColor(debugObject.clearColor))

renderer.setClearColor(debugObject.clearColor)

/**
 * Animate
 */
const clock = new THREE.Clock()

const tick = () => {
    const elapsedTime = clock.getElapsedTime()

    // Update materials
    fireFliesMaterial.uniforms.uTime.value = elapsedTime
    
    portalLightMaterial.uniforms.uTime.value = elapsedTime

    // Update controls
    controls.update()

    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()