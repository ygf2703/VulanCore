import { useEffect, useRef } from 'react'
import * as THREE from 'three'

const FALLBACK_COLORS = ['#2563eb', '#facc15', '#ffffff', '#0f172a', '#64748b']

function normalizeColor(color, fallback) {
  return /^#[0-9a-f]{6}$/i.test(color ?? '') ? color : fallback
}

function disposeObject(object) {
  object.traverse((child) => {
    if (child.geometry) child.geometry.dispose()
    if (child.material) {
      const materials = Array.isArray(child.material) ? child.material : [child.material]
      materials.forEach((material) => material.dispose())
    }
  })
}

export function DashboardPulseScene({ colors = FALLBACK_COLORS }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const container = canvas?.parentElement
    if (!canvas || !container) return undefined

    const palette = FALLBACK_COLORS.map((fallback, index) =>
      normalizeColor(colors[index], fallback),
    )
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100)
    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: true,
    })
    const root = new THREE.Group()
    const columns = []
    const pointer = { x: 0, y: 0 }
    let animationFrame = 0

    renderer.setClearColor(0x000000, 0)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
    camera.position.set(0, 1.05, 7.2)
    scene.add(root)

    scene.add(new THREE.AmbientLight(0xffffff, 1.15))

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.4)
    keyLight.position.set(3.8, 5, 5.5)
    scene.add(keyLight)

    const coolLight = new THREE.PointLight(new THREE.Color(palette[0]), 24, 10)
    coolLight.position.set(-3.2, 2.2, 3)
    scene.add(coolLight)

    const warmLight = new THREE.PointLight(new THREE.Color(palette[1]), 18, 9)
    warmLight.position.set(3, -0.4, 2.4)
    scene.add(warmLight)

    const grid = new THREE.GridHelper(6.4, 14, palette[4], palette[0])
    grid.position.y = -1.25
    grid.material.transparent = true
    grid.material.opacity = 0.18
    root.add(grid)

    const ringMaterial = new THREE.MeshStandardMaterial({
      color: palette[1],
      emissive: palette[1],
      emissiveIntensity: 0.18,
      metalness: 0.35,
      roughness: 0.22,
      transparent: true,
      opacity: 0.9,
    })
    const outerRing = new THREE.Mesh(new THREE.TorusGeometry(2.05, 0.025, 18, 120), ringMaterial)
    outerRing.rotation.x = Math.PI / 2.75
    root.add(outerRing)

    const innerRing = new THREE.Mesh(
      new THREE.TorusGeometry(1.18, 0.018, 16, 96),
      ringMaterial.clone(),
    )
    innerRing.rotation.x = Math.PI / 2.35
    innerRing.rotation.y = Math.PI / 6
    root.add(innerRing)

    const metricHeights = [1.15, 0.82, 1.62, 1.02, 1.38]
    metricHeights.forEach((height, index) => {
      const material = new THREE.MeshStandardMaterial({
        color: palette[index % palette.length],
        emissive: palette[index % palette.length],
        emissiveIntensity: index === 2 ? 0.08 : 0.16,
        metalness: 0.42,
        roughness: 0.28,
        transparent: true,
        opacity: index === 2 ? 0.66 : 0.93,
      })
      const column = new THREE.Mesh(new THREE.BoxGeometry(0.44, height, 0.44), material)
      column.position.set((index - 2) * 0.62, -1.25 + height / 2, 0)
      column.rotation.y = index * 0.14
      column.userData.baseHeight = height
      columns.push(column)
      root.add(column)

      const edge = new THREE.LineSegments(
        new THREE.EdgesGeometry(column.geometry),
        new THREE.LineBasicMaterial({
          color: '#ffffff',
          transparent: true,
          opacity: 0.18,
        }),
      )
      column.add(edge)
    })

    const nodeMaterial = new THREE.MeshStandardMaterial({
      color: palette[0],
      emissive: palette[0],
      emissiveIntensity: 0.22,
      metalness: 0.25,
      roughness: 0.32,
    })
    for (let index = 0; index < 14; index += 1) {
      const angle = (index / 14) * Math.PI * 2
      const radius = 2.05 + (index % 3) * 0.16
      const node = new THREE.Mesh(new THREE.SphereGeometry(0.055, 20, 20), nodeMaterial.clone())
      node.position.set(Math.cos(angle) * radius, -0.05 + Math.sin(index) * 0.18, Math.sin(angle) * 0.88)
      root.add(node)
    }

    const resize = () => {
      const width = Math.max(container.clientWidth, 320)
      const height = Math.max(container.clientHeight, 220)
      renderer.setSize(width, height, false)
      camera.aspect = width / height
      camera.updateProjectionMatrix()
    }

    const handlePointerMove = (event) => {
      const rect = container.getBoundingClientRect()
      pointer.x = ((event.clientX - rect.left) / rect.width - 0.5) * 2
      pointer.y = ((event.clientY - rect.top) / rect.height - 0.5) * 2
    }

    const animate = (time = 0) => {
      const seconds = time * 0.001
      const motion = prefersReducedMotion ? 0 : seconds
      root.rotation.y = motion * 0.15 + pointer.x * 0.16
      root.rotation.x = -0.18 + pointer.y * 0.08
      outerRing.rotation.z = motion * 0.28
      innerRing.rotation.z = -motion * 0.34

      columns.forEach((column, index) => {
        const pulse = prefersReducedMotion ? 1 : 1 + Math.sin(seconds * 1.6 + index) * 0.045
        column.scale.y = pulse
      })

      renderer.render(scene, camera)
      animationFrame = window.requestAnimationFrame(animate)
    }

    const observer = new ResizeObserver(resize)
    observer.observe(container)
    container.addEventListener('pointermove', handlePointerMove)
    resize()
    animate()

    return () => {
      window.cancelAnimationFrame(animationFrame)
      observer.disconnect()
      container.removeEventListener('pointermove', handlePointerMove)
      disposeObject(root)
      nodeMaterial.dispose()
      renderer.dispose()
    }
  }, [colors])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="absolute inset-0 h-full w-full"
    />
  )
}
