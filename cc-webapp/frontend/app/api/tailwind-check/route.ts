import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    // globals.css 확인
    const globalsPath = path.join(process.cwd(), 'styles', 'globals.css');
    const globalsExists = fs.existsSync(globalsPath);
    
    // tailwind.config.js 확인
    const tailwindConfigPath = path.join(process.cwd(), 'tailwind.config.js');
    const tailwindConfigExists = fs.existsSync(tailwindConfigPath);
    
    // postcss.config.js 확인
    const postcssConfigPath = path.join(process.cwd(), 'postcss.config.js');
    const postcssConfigExists = fs.existsSync(postcssConfigPath);
    
    let globalsContent = '';
    if (globalsExists) {
      globalsContent = fs.readFileSync(globalsPath, 'utf-8');
    }
    
    // Tailwind 지시문 확인
    const hasTailwindBase = globalsContent.includes('@tailwind base') || globalsContent.includes('@import "tailwindcss/base"');
    const hasTailwindComponents = globalsContent.includes('@tailwind components') || globalsContent.includes('@import "tailwindcss/components"');
    const hasTailwindUtilities = globalsContent.includes('@tailwind utilities') || globalsContent.includes('@import "tailwindcss/utilities"');
    
    return NextResponse.json({
      files: {
        globalsCSS: globalsExists,
        tailwindConfig: tailwindConfigExists,
        postcssConfig: postcssConfigExists
      },
      tailwindDirectives: {
        base: hasTailwindBase,
        components: hasTailwindComponents,
        utilities: hasTailwindUtilities
      },
      cssVariables: (globalsContent.match(/--[\w-]+:/g) || []).length,
      environment: {
        nodeEnv: process.env.NODE_ENV,
        nextVersion: process.env.npm_package_dependencies_next
      }
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}