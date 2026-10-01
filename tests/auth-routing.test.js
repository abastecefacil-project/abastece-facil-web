import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import { test } from 'node:test'

test('rotas do sistema exigem login e preservam permissões por perfil', () => {
  let routes, guard
  const auth = { isAuthenticated: false, perfil: 'COLABORADOR', homeDoPerfil: '/user/dashboardUser' }
  const source = readFileSync(new URL('../src/router/index.js', import.meta.url), 'utf8')
    .replace(/^import .*$/gm, '')
    .replace('import.meta.env.BASE_URL', "'/'")
    .replace('export default router', '')
  runInNewContext(source, {
    AdminLayout: {}, DefaultLayout: {},
    createWebHistory: () => ({}),
    useAuthStore: () => auth,
    createRouter: (options) => {
      routes = options.routes
      return { beforeEach: (callback) => { guard = callback } }
    },
  })
  const navigate = (meta) => {
    let destination
    guard({ meta }, {}, (value) => { destination = value })
    return destination
  }
  for (const parent of routes) {
    for (const route of parent.children.filter((route) => route.component)) {
      const meta = { ...parent.meta, ...route.meta }
      assert.equal(navigate(meta), parent.path === '/' ? undefined : '/login', route.name)
      auth.isAuthenticated = true
      assert.equal(navigate(meta), parent.path === '/admin' ? auth.homeDoPerfil : undefined, route.name)
      auth.perfil = 'GESTOR_FROTA'
      assert.equal(navigate(meta), undefined, route.name)
      auth.isAuthenticated = false
      auth.perfil = 'COLABORADOR'
    }
  }
})
