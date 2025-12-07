/**
 * Supabase接続テストスクリプト
 * 環境変数が正しく設定されているか確認します
 * 
 * 実行方法:
 * npx tsx scripts/test-connection.ts
 */

import { config } from 'dotenv'
import { resolve } from 'path'
import { createClient } from '@supabase/supabase-js'

// .env.localファイルを読み込む
config({ path: resolve(process.cwd(), '.env.local') })

// 環境変数の確認
console.log('🔍 環境変数の確認...\n')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const openaiApiKey = process.env.OPENAI_API_KEY

// 必須環境変数のチェック
const missingVars: string[] = []

if (!supabaseUrl) {
  missingVars.push('NEXT_PUBLIC_SUPABASE_URL')
  console.log('❌ NEXT_PUBLIC_SUPABASE_URL: 未設定')
} else {
  // URLの形式をチェック
  if (!supabaseUrl.startsWith('http://') && !supabaseUrl.startsWith('https://')) {
    console.log('❌ NEXT_PUBLIC_SUPABASE_URL: 形式が正しくありません')
    console.log('   現在の値:', supabaseUrl)
    console.log('   正しい形式: https://xxxxxxxxxxxxx.supabase.co')
    console.log('   Supabaseダッシュボードの「Settings」→「API」→「Project URL」から完全なURLをコピーしてください')
    missingVars.push('NEXT_PUBLIC_SUPABASE_URL (形式エラー)')
  } else {
    console.log('✅ NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl)
  }
}

if (!supabaseAnonKey) {
  missingVars.push('NEXT_PUBLIC_SUPABASE_ANON_KEY')
  console.log('❌ NEXT_PUBLIC_SUPABASE_ANON_KEY: 未設定')
} else {
  console.log('✅ NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey.substring(0, 20) + '...')
}

if (!supabaseServiceRoleKey) {
  missingVars.push('SUPABASE_SERVICE_ROLE_KEY')
  console.log('❌ SUPABASE_SERVICE_ROLE_KEY: 未設定')
} else {
  console.log('✅ SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceRoleKey.substring(0, 20) + '...')
}

if (!openaiApiKey) {
  missingVars.push('OPENAI_API_KEY')
  console.log('❌ OPENAI_API_KEY: 未設定')
} else {
  console.log('✅ OPENAI_API_KEY:', openaiApiKey.substring(0, 10) + '...')
}

if (missingVars.length > 0) {
  console.log('\n⚠️  以下の環境変数が設定されていません:')
  missingVars.forEach(v => console.log(`   - ${v}`))
  console.log('\n.env.localファイルを確認してください。')
  process.exit(1)
}

console.log('\n🔌 Supabaseへの接続テスト...\n')

// URLの最終チェック
if (!supabaseUrl || (!supabaseUrl.startsWith('http://') && !supabaseUrl.startsWith('https://'))) {
  console.log('❌ NEXT_PUBLIC_SUPABASE_URLの形式が正しくありません')
  console.log('   現在の値:', supabaseUrl || '(未設定)')
  console.log('\n📋 修正方法:')
  console.log('1. Supabaseダッシュボードの「Settings」→「API」を開く')
  console.log('2. 「Project URL」の値をコピー（例: https://xxxxxxxxxxxxx.supabase.co）')
  console.log('3. .env.localファイルのNEXT_PUBLIC_SUPABASE_URLに完全なURLを設定')
  console.log('   注意: プロジェクトIDだけではなく、https://から始まる完全なURLが必要です\n')
  process.exit(1)
}

// Supabaseクライアントの作成
const supabase = createClient(supabaseUrl!, supabaseAnonKey!)

// 接続テスト: coursesテーブルにアクセスしてみる
async function testConnection() {
  try {
    const { data, error } = await supabase
      .from('courses')
      .select('count')
      .limit(1)

    if (error) {
      // テーブルが存在しない場合（スキーマ未適用）
      if (error.code === '42P01' || error.message.includes('does not exist')) {
        console.log('❌ データベーススキーマが適用されていません')
        console.log('\n📋 次のステップ:')
        console.log('1. Supabaseダッシュボードの「SQL Editor」を開く')
        console.log('2. schema.sqlの内容をコピー＆ペースト')
        console.log('3. 実行ボタンをクリック')
        console.log('4. このスクリプトを再実行してください\n')
        process.exit(1)
      } else {
        console.log('❌ 接続エラー:', error.message)
        console.log('エラーコード:', error.code)
        process.exit(1)
      }
    } else {
      console.log('✅ Supabaseへの接続成功！')
      console.log('✅ データベーススキーマが正しく適用されています\n')
      
      // テーブルの存在確認
      const tables = ['courses', 'lectures', 'posts', 'likes', 'summaries']
      console.log('📊 テーブルの確認...\n')
      
      for (const table of tables) {
        const { error: tableError } = await supabase
          .from(table)
          .select('*')
          .limit(0)
        
        if (tableError) {
          console.log(`❌ ${table}: テーブルが存在しません`)
        } else {
          console.log(`✅ ${table}: OK`)
        }
      }
      
      console.log('\n🎉 すべての設定が完了しています！')
      console.log('次のステップ: npm run dev で開発サーバーを起動してください\n')
    }
  } catch (err) {
    console.log('❌ 予期しないエラーが発生しました:')
    console.log(err)
    process.exit(1)
  }
}

testConnection()

