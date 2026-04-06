

## [1.8.3](https://github.com/nikdanilov/whisper-obsidian-plugin/compare/1.8.2...1.8.3) (2026-04-06)


### Features

* store API keys in Obsidian SecretStorage instead of data.json ([#83](https://github.com/nikdanilov/whisper-obsidian-plugin/issues/83)) ([f7c7e18](https://github.com/nikdanilov/whisper-obsidian-plugin/commit/f7c7e1894a46a4a73b3701d90573c091353a4e74))

## [1.6.1](https://github.com/nikdanilov/whisper-obsidian-plugin/compare/1.6.0...1.6.1) (2026-04-05)


### Bug Fixes

* recording controls UX — show/hide buttons, paused state ([0fbd64c](https://github.com/nikdanilov/whisper-obsidian-plugin/commit/0fbd64c368a3cd13e7319179aee108ffc1589963))

## [1.6.0](https://github.com/nikdanilov/whisper-obsidian-plugin/compare/1.5.5...1.6.0) (2026-04-05)


### Features

* accept video files for upload/transcription ([#63](https://github.com/nikdanilov/whisper-obsidian-plugin/issues/63)) ([8d8b1f9](https://github.com/nikdanilov/whisper-obsidian-plugin/commit/8d8b1f9f10577a65fca2476c53adbd71a73c6272))
* add audio device selection to settings ([5492d49](https://github.com/nikdanilov/whisper-obsidian-plugin/commit/5492d4901fe32effb4c7fa7f9712de3f11a5548f))
* add cancel recording button ([#46](https://github.com/nikdanilov/whisper-obsidian-plugin/issues/46)) ([c3f0c46](https://github.com/nikdanilov/whisper-obsidian-plugin/commit/c3f0c46794f77e87a9a194cdd8fddff8977be1f2))
* add test infrastructure and feature plan ([1b12bda](https://github.com/nikdanilov/whisper-obsidian-plugin/commit/1b12bda5b00789d376c3cd93b668ba30fae047d5))
* add transcribe action to file menu ([816606f](https://github.com/nikdanilov/whisper-obsidian-plugin/commit/816606fad873a97562d5e3e00cfb9b2727594f9b))
* auto-detect language when left empty ([#47](https://github.com/nikdanilov/whisper-obsidian-plugin/issues/47)) ([3b82849](https://github.com/nikdanilov/whisper-obsidian-plugin/commit/3b828498d8d584c60f4d755b49c6fa47f243037b))
* expose pause/resume and open controls as commands ([#77](https://github.com/nikdanilov/whisper-obsidian-plugin/issues/77), [#29](https://github.com/nikdanilov/whisper-obsidian-plugin/issues/29)) ([8e0cc4e](https://github.com/nikdanilov/whisper-obsidian-plugin/commit/8e0cc4e6fbe65839a270e6d74f5249fa7d5ba852))
* expose temperature and response_format settings ([#35](https://github.com/nikdanilov/whisper-obsidian-plugin/issues/35)) ([fcd97e8](https://github.com/nikdanilov/whisper-obsidian-plugin/commit/fcd97e88a82f0b500f789f04c63501ddf85770b8))
* independent paste-at-cursor and save-to-file toggles ([#64](https://github.com/nikdanilov/whisper-obsidian-plugin/issues/64)) ([6147aeb](https://github.com/nikdanilov/whisper-obsidian-plugin/commit/6147aeb936e0d9ceba8676857ed986500189e9a4))
* option to ignore original filename on upload ([#68](https://github.com/nikdanilov/whisper-obsidian-plugin/issues/68)) ([bb02e25](https://github.com/nikdanilov/whisper-obsidian-plugin/commit/bb02e250842a88e24560acc66a83bb74f9eb1f0b))
* send surrounding text as Whisper prompt context ([#71](https://github.com/nikdanilov/whisper-obsidian-plugin/issues/71)) ([f9e27b2](https://github.com/nikdanilov/whisper-obsidian-plugin/commit/f9e27b2fde6156b2c76450456bf83a6201b39641))
* show notice when recording starts ([#41](https://github.com/nikdanilov/whisper-obsidian-plugin/issues/41)) ([71f5a29](https://github.com/nikdanilov/whisper-obsidian-plugin/commit/71f5a297d5e22c7dbaf89bd403fa3bf6e93b1659))
* support custom API endpoints without API key ([#2](https://github.com/nikdanilov/whisper-obsidian-plugin/issues/2), [#61](https://github.com/nikdanilov/whisper-obsidian-plugin/issues/61), [#74](https://github.com/nikdanilov/whisper-obsidian-plugin/issues/74)) ([7850f12](https://github.com/nikdanilov/whisper-obsidian-plugin/commit/7850f123953395d8ba576db57327eae30661e36c))
* toggle between embed and link for audio file reference ([#26](https://github.com/nikdanilov/whisper-obsidian-plugin/issues/26)) ([257c10a](https://github.com/nikdanilov/whisper-obsidian-plugin/commit/257c10a892e23d9009bdeca4f0ad17c254a0933c))


### Bug Fixes

* auto-create folders when they don't exist ([#40](https://github.com/nikdanilov/whisper-obsidian-plugin/issues/40)) ([91ccc2a](https://github.com/nikdanilov/whisper-obsidian-plugin/commit/91ccc2a3aad0cba69cb22f821a0cf33bded7ec7e))
* bugs found during codebase audit ([efec1af](https://github.com/nikdanilov/whisper-obsidian-plugin/commit/efec1af15c68b445c2457026c15d6ff84e7f47de))
* **build:** default OUTPUT_PATH to current directory when undefined ([167bfb3](https://github.com/nikdanilov/whisper-obsidian-plugin/commit/167bfb30d1416067db08409d8d7eebb1ceabda6f))
* don't link to nonexistent audio file when save is off ([#52](https://github.com/nikdanilov/whisper-obsidian-plugin/issues/52)) ([2a38144](https://github.com/nikdanilov/whisper-obsidian-plugin/commit/2a381448ab8e152d11c480177232c1f1f6e7631d))
* improve mobile audio compatibility ([#76](https://github.com/nikdanilov/whisper-obsidian-plugin/issues/76), [#73](https://github.com/nikdanilov/whisper-obsidian-plugin/issues/73), [#60](https://github.com/nikdanilov/whisper-obsidian-plugin/issues/60)) ([ef6a016](https://github.com/nikdanilov/whisper-obsidian-plugin/commit/ef6a0166a8c933fcf0c99644e1459e3ff1febc43))
* improve notification copy ([a1d8aca](https://github.com/nikdanilov/whisper-obsidian-plugin/commit/a1d8aca02be9ffaf2f0834dde58156c5074a8316))
* organize settings into sections, remove redundant title ([24e5396](https://github.com/nikdanilov/whisper-obsidian-plugin/commit/24e539656b99bc77e5211cf6c4f385099621dbe7))
* skip transcription for silent/too-short recordings ([#65](https://github.com/nikdanilov/whisper-obsidian-plugin/issues/65), [#56](https://github.com/nikdanilov/whisper-obsidian-plugin/issues/56)) ([7a5092d](https://github.com/nikdanilov/whisper-obsidian-plugin/commit/7a5092da56163fa35fb2b944f5b1976cf7f92662))

## [1.5.5](https://github.com/nikdanilov/whisper-obsidian-plugin/compare/1.5.4...1.5.5) (2024-01-29)


### Features

* add debug mode ([2d356a1](https://github.com/nikdanilov/whisper-obsidian-plugin/commit/2d356a12ddc2fd24d99c02a73641573c32022b93))

## [1.5.4](https://github.com/nikdanilov/whisper-obsidian-plugin/compare/1.5.3...1.5.4) (2024-01-29)


### Bug Fixes

* update mimeType list and use 'audio/webm' by default if possible ([8e8747c](https://github.com/nikdanilov/whisper-obsidian-plugin/commit/8e8747c3221da8868b7af79b16ba4aef67cc15b2))

## [1.5.3](https://github.com/nikdanilov/whisper-obsidian-plugin/compare/1.5.2...1.5.3) (2024-01-29)


### Features

* add support of prompt parameter ([786644e](https://github.com/nikdanilov/whisper-obsidian-plugin/commit/786644ed939ccc8e4a2b2bcc9beffb21173c38ed))


### Bug Fixes

* add prompt type and desc ([d25ea92](https://github.com/nikdanilov/whisper-obsidian-plugin/commit/d25ea9234df339c3b0ee8bf1b15984751576d62e))

## [1.5.2](https://github.com/nikdanilov/whisper-obsidian-plugin/compare/1.5.1...1.5.2) (2024-01-29)


### Bug Fixes

* update AudioHandler to try...catch 'save_audio' and 'parse_audio' ([89fc56e](https://github.com/nikdanilov/whisper-obsidian-plugin/commit/89fc56e8bcda9ffdfaf255cc3877e82ecc4c297a))

## [1.5.1](https://github.com/nikdanilov/whisper-obsidian-plugin/compare/1.5.0...1.5.1) (2023-06-19)


### Features

* set outputdir to env variable ([077c5ee](https://github.com/nikdanilov/whisper-obsidian-plugin/commit/077c5eedda82d71c9a0c2f6d81ab8d5371f4b4b7))


### Bug Fixes

* add misc updates ([f3d4906](https://github.com/nikdanilov/whisper-obsidian-plugin/commit/f3d490670a468e39a1872cdc2a3cff01cf0fcd27))
* replace path module with js function ([bad6dc0](https://github.com/nikdanilov/whisper-obsidian-plugin/commit/bad6dc0db11faca49dedbcda9817fd374f8cbfd8))
* update manifest ([0d7c236](https://github.com/nikdanilov/whisper-obsidian-plugin/commit/0d7c236942713e5fddf7eb45e9d439e431765f0f))

## [1.5.0](https://github.com/nikdanilov/whisper-obsidian-plugin/compare/1.4.2...1.5.0) (2023-06-18)


### Features

* add preserve audio file ([f8517e4](https://github.com/nikdanilov/whisper-obsidian-plugin/commit/f8517e44219dc8b1b1d2875ec4b0230fe835d95b))
* add save audio file setting ([d21e4b3](https://github.com/nikdanilov/whisper-obsidian-plugin/commit/d21e4b3a2556a25142b5c748b3734cf519abb689))
* add upload audio file feature ([c340b22](https://github.com/nikdanilov/whisper-obsidian-plugin/commit/c340b22ff3d1abb9e853b0b2a59ed53025edfc2b))


### Bug Fixes

* fix typo ([fcce20d](https://github.com/nikdanilov/whisper-obsidian-plugin/commit/fcce20de8123d34405cfd6bd62578ae05d53a5f0))
* update settings desc ([7b65bfc](https://github.com/nikdanilov/whisper-obsidian-plugin/commit/7b65bfcdf5a09b0798b704b3cc98c5f9bc8fa664))

## [1.4.2](https://github.com/nikdanilov/whisper-obsidian-plugin/compare/1.4.1...1.4.2) (2023-06-12)

## [1.4.1](https://github.com/nikdanilov/whisper-obsidian-plugin/compare/1.4.0...1.4.1) (2023-06-12)


### Bug Fixes

* release mic after use ([651ed76](https://github.com/nikdanilov/whisper-obsidian-plugin/commit/651ed76a5a57e23419931b9314478093ed597410))

## [1.4.0](https://github.com/nikdanilov/whisper-obsidian-plugin/compare/1.3.0...1.4.0) (2023-06-12)


### Features

* add new alert ([6439e7b](https://github.com/nikdanilov/whisper-obsidian-plugin/commit/6439e7b6e33882e9e2ee87fd85dcfe528bb4afaa))

## [1.3.0](https://github.com/nikdanilov/whisper-obsidian-plugin/compare/1.2.0...1.3.0) (2023-05-01)

### Features

-   refactor settings tab ([f25b880](https://github.com/nikdanilov/whisper-obsidian-plugin/commit/f25b88052c3f633249d688954e5a1d6028fcd4dc))
-   refactor status bar ([9f6bfa2](https://github.com/nikdanilov/whisper-obsidian-plugin/commit/9f6bfa214611a771fc30bd14c504064dc90cdb01))

## 1.2.0 (2023-04-29)

### Features

-   split codebase into smaller components ([e7b3498](https://github.com/nikdanilov/whisper-obsidian-plugin/commit/e7b3498481e2dddd811e46f0fe0bd939e01978f1))

### Bug Fixes

-   fix MIME type for mobile devices ([1db4866](https://github.com/nikdanilov/whisper-obsidian-plugin/commit/1db486613ced5b12022f303d926dd91fdda74ad2))

## 1.1.0 (2023-04-29)

### Features

-   split codebase into smaller components ([e7b3498](https://github.com/nikdanilov/whisper-obsidian-plugin/commit/e7b3498481e2dddd811e46f0fe0bd939e01978f1))