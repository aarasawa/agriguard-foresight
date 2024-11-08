/// <reference types="vite/client" />
/// <reference types="@types/google.maps" />

interface ImportMetaEnv {
  readonly VITE_MAPS_API_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}