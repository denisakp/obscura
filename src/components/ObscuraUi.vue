<script setup lang="ts">
import { ref, reactive, onMounted, watch } from 'vue'

import { type PasswordOptions, generatePasswords } from '@/utils/obscura.ts'

type OptionKey = keyof PasswordOptions | 'autoGenerate' | 'savePreferences'

type CheckBoxOption = {
  key: OptionKey
  label: string
  description: string
}

const options = reactive<PasswordOptions>({
  length: 12,
  includeLowercase: true,
  includeUppercase: true,
  includeDigits: true,
  includeSymbols: true,
  excludeSimilarCharacters: true,
  noDuplicateCharacters: true,
  noSequentialCharacters: true,
  beginWithLetter: true,
  quantity: 5,
})

const checkboxes: Array<CheckBoxOption> = [
  {
    key: 'includeDigits',
    label: 'Include Numbers:',
    description: '( e.g. 123456 )',
  },
  {
    key: 'includeLowercase',
    label: 'Include Lowercase Characters:',
    description: '( e.g. abcdefgh )',
  },
  {
    key: 'includeUppercase',
    label: 'Include Uppercase Characters:',
    description: '( e.g. ABCDEFGH )',
  },
  {
    key: 'includeSymbols',
    label: 'Include Symbols:',
    description: '( !\"#$%&\'()*+,-./:;<=>?@[]^_{|}~` )',
  },
  {
    key: 'beginWithLetter',
    label: 'Begin With A Letter:',
    description: "( don't begin with a number or symbol )",
  },
  {
    key: 'excludeSimilarCharacters',
    label: 'No Similar Characters:',
    description: "( don't use characters like i, l, 1, L, o, 0, O, etc. )",
  },
  {
    key: 'noDuplicateCharacters',
    label: 'No Duplicate Characters:',
    description: "( don't use the same character more than once )",
  },
  {
    key: 'noSequentialCharacters',
    label: 'No Sequential Characters:',
    description: "( don't use sequential characters, e.g. abc, 789 )",
  },
  {
    key: 'autoGenerate',
    label: 'Auto Generate On The First Call:',
    description: '( generate passwords automatically when you open this page )',
  },
  {
    key: 'savePreferences',
    label: 'Save My Preference:',
    description: '( save all the settings above in cookies )',
  },
]

const autoGenerate = ref(true)
const savePreferences = ref(false)
const passwords = ref<string[]>([])

const generatePassword = () => {
  try {
    passwords.value = generatePasswords(options)
  } catch (error) {
    console.error('Error generating passwords:', error)
  }
}

const copyFirstPassword = () => {
  if (passwords.value.length > 0) {
    navigator.clipboard
      .writeText(passwords.value[0])
      .then(() => {
        console.log('Copied password:', passwords.value[0])
      })
      .catch((err) => {
        console.error('Error copied password:', err)
      })
  }
}

const copyAllPasswords = () => {
  if (passwords.value.length > 0) {
    navigator.clipboard
      .writeText(passwords.value.join('\n'))
      .then(() => {
        console.log('Copied all passwords')
      })
      .catch((err) => {
        console.error('Error copied all passwords:', err)
      })
  }
}

const loadPreferences = () => {
  const savedOptions = JSON.parse(localStorage.getItem('passwordOptions') || '{}')
  Object.assign(options, savedOptions)
}

const downloadPasswordAsTxt = () => {
  if (passwords.value.length === 0) {
    generatePassword()
  }

  const text = passwords.value.join('\n')
  const blob = new Blob([text], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)

  const a = document.createElement('a')
  a.href = url
  a.download = `obscura-passwords-${new Date().toISOString().split('T')[0]}.txt`
  document.body.appendChild(a)
  a.click()

  setTimeout(() => {
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, 100)
}

onMounted(() => {
  if (autoGenerate.value) {
    generatePassword()
  }
  loadPreferences()
})

watch(savePreferences, (newVal) => {
  if (newVal) {
    localStorage.setItem('passwordOptions', JSON.stringify(options))
  }
})

watch(
  options,
  () => {
    if (savePreferences.value) {
      localStorage.setItem('passwordOptions', JSON.stringify(options))
    }
  },
  { deep: true },
)
</script>

<template>
  <div class="min-h-screen bg-neutral-800 py-8 px-4 sm:px-6 lg:px-8">
    <div class="max-w-3xl mx-auto">
      <!-- Header -->
      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold text-gray-300">Obscura</h1>
        <p class="mt-2 text-gray-300">Secure Password Generator 🔐</p>
      </div>

      <!-- body -->
      <div class="bg-white shadow rounded-lg p-6">
        <!-- Generator options -->
        <div class="space-y">
          <!-- Password length -->
          <div class="grid grid-cols-2 items-center">
            <label class="block text-sm font-medium text-gray-700"> Password Length: </label>
            <div class="w-full">
              <input
                type="range"
                v-model.number="options.length"
                min="8"
                max="64"
                class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div class="text-center text-sm text-gray-500">{{ options.length }}</div>
            </div>
          </div>

          <!-- quantity -->
          <div class="grid grid-cols-2 items-center">
            <label class="block text-sm font-medium text-gray-700"> Quantity: </label>
            <div class="w-full">
              <input
                type="range"
                v-model.number="options.quantity"
                min="1"
                max="50"
                class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div class="text-center text-sm text-gray-500">{{ options.quantity }}</div>
            </div>
          </div>

          <!-- Regular checkboxes -->
          <div
            v-for="checkbox in checkboxes"
            :key="checkbox.key"
            class="grid grid-cols-2 items-center py-2"
          >
            <label class="block text-sm font-medium text-gray-700">
              {{ checkbox.label }}
            </label>
            <div class="flex items-center">
              <input
                v-if="checkbox.key === 'includeSymbols'"
                type="checkbox"
                v-model="options.includeSymbols"
                class="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <input
                v-else-if="checkbox.key === 'autoGenerate'"
                type="checkbox"
                v-model="autoGenerate"
                class="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <input
                v-else-if="checkbox.key === 'savePreferences'"
                type="checkbox"
                v-model="savePreferences"
                class="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <input
                v-else-if="checkbox.key in options"
                type="checkbox"
                v-model="options[checkbox.key]"
                class="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span
                class="ml-2 text-sm text-gray-500"
                v-html="
                  checkbox.key === 'includeSymbols' ? checkbox.description : checkbox.description
                "
              ></span>
            </div>
          </div>
        </div>

        <!-- Boutons -->
        <div class="mt-6 flex flex-wrap gap-4">
          <button
            @click="generatePassword"
            class="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 py-2 px-4 rounded-md border border-gray-300 font-medium"
          >
            Generate
          </button>

          <button
            @click="copyFirstPassword"
            class="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 py-2 px-4 rounded-md border border-gray-300 font-medium"
          >
            Copy the 1st item
          </button>

          <button
            @click="copyAllPasswords"
            class="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 py-2 px-4 rounded-md border border-gray-300 font-medium"
          >
            Copy ALL
          </button>

          <button
            @click="downloadPasswordAsTxt"
            class="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 py-2 px-4 rounded-md border border-gray-300 font-medium"
          >
            Download as .txt
          </button>
        </div>
      </div>

      <!-- Results -->
      <div class="mt-6">
        <h2 class="text-lg font-medium text-white mb-2">Output:</h2>
        <div class="border bg-white shadow border-gray-300 rounded-md overflow-hidden">
          <table class="w-full">
            <tbody>
              <tr
                v-for="(password, index) in passwords"
                :key="index"
                class="border-b border-gray-300 last:border-b-0"
              >
                <td class="bg-blue-600 text-white p-2 w-12 text-center">{{ index + 1 }}</td>
                <td class="p-3 font-mono">{{ password }}</td>
              </tr>
              <tr v-if="passwords.length === 0">
                <td class="bg-blue-600 text-white p-2 w-12 text-center">-</td>
                <td class="p-3 text-gray-500 italic">
                  Cliquez sur "Generate" pour créer des mots de passe
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>
