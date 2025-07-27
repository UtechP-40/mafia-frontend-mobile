#!/usr/bin/env ts-node

import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

interface TestResult {
  testFile: string;
  passed: boolean;
  duration: number;
  output: string;
  error?: string;
}

class FrontendE2ETestRunner {
  private results: TestResult[] = [];
  private startTime: number = 0;

  constructor() {
    this.startTime = Date.now();
  }

  async runTest(testFile: string): Promise<TestResult> {
    return new Promise((resolve) => {
      const startTime = Date.now();
      let output = '';
      let error = '';

      console.log(`\n📱 Running ${testFile}...`);

      const testProcess = spawn('npx', ['jest', testFile, '--verbose', '--detectOpenHandles'], {
        cwd: path.join(__dirname, '../../..'),
        stdio: ['pipe', 'pipe', 'pipe']
      });

      testProcess.stdout.on('data', (data) => {
        const chunk = data.toString();
        output += chunk;
        process.stdout.write(chunk);
      });

      testProcess.stderr.on('data', (data) => {
        const chunk = data.toString();
        error += chunk;
        process.stderr.write(chunk);
      });

      testProcess.on('close', (code) => {
        const duration = Date.now() - startTime;
        const result: TestResult = {
          testFile,
          passed: code === 0,
          duration,
          output,
          error: error || undefined
        };

        this.results.push(result);
        
        if (code === 0) {
          console.log(`✅ ${testFile} passed in ${duration}ms`);
        } else {
          console.log(`❌ ${testFile} failed in ${duration}ms`);
        }

        resolve(result);
      });
    });
  }

  async runAllTests(): Promise<void> {
    console.log('📱 Starting Frontend End-to-End Integration Test Suite');
    console.log('=' .repeat(60));

    const testFiles = [
      'auth-integration.test.tsx',
      'friends-integration.test.tsx',
      'real-time-game.test.tsx',
      'e2e-integration.test.tsx'
    ];

    // Run tests sequentially to avoid state conflicts
    for (const testFile of testFiles) {
      await this.runTest(testFile);
    }

    this.generateReport();
  }

  private generateReport(): void {
    const totalDuration = Date.now() - this.startTime;
    const passedTests = this.results.filter(r => r.passed);
    const failedTests = this.results.filter(r => !r.passed);

    console.log('\n' + '='.repeat(60));
    console.log('📊 FRONTEND E2E INTEGRATION TEST REPORT');
    console.log('='.repeat(60));

    console.log(`\n📈 Summary:`);
    console.log(`   Total Tests: ${this.results.length}`);
    console.log(`   Passed: ${passedTests.length} ✅`);
    console.log(`   Failed: ${failedTests.length} ❌`);
    console.log(`   Total Duration: ${totalDuration}ms`);

    if (passedTests.length > 0) {
      console.log(`\n✅ Passed Tests:`);
      passedTests.forEach(result => {
        console.log(`   • ${result.testFile} (${result.duration}ms)`);
      });
    }

    if (failedTests.length > 0) {
      console.log(`\n❌ Failed Tests:`);
      failedTests.forEach(result => {
        console.log(`   • ${result.testFile} (${result.duration}ms)`);
        if (result.error) {
          console.log(`     Error: ${result.error.split('\n')[0]}`);
        }
      });
    }

    // Test coverage analysis
    this.analyzeCoverage();

    // Generate detailed report file
    this.generateDetailedReport();

    console.log('\n' + '='.repeat(60));
    
    if (failedTests.length === 0) {
      console.log('🎉 All frontend integration tests passed!');
      process.exit(0);
    } else {
      console.log('💥 Some frontend integration tests failed. Check the detailed report.');
      process.exit(1);
    }
  }

  private analyzeCoverage(): void {
    console.log(`\n📋 Test Coverage Analysis:`);
    
    const coverageAreas = [
      {
        area: 'Authentication Flows',
        tests: ['auth-integration.test.tsx'],
        scenarios: [
          'User registration with validation',
          'Login with credentials',
          'Biometric authentication',
          'Password reset flow',
          'Social login integration',
          'Token refresh handling'
        ]
      },
      {
        area: 'Friend System',
        tests: ['friends-integration.test.tsx'],
        scenarios: [
          'Friend search and discovery',
          'Friend request workflow',
          'Friend invitation to games',
          'Friend activity tracking',
          'Cross-platform friend interactions'
        ]
      },
      {
        area: 'Real-Time Gaming',
        tests: ['real-time-game.test.tsx', 'e2e-integration.test.tsx'],
        scenarios: [
          'Game state synchronization',
          'Multi-player interactions',
          'Chat system integration',
          'Voice chat functionality',
          'Disconnection/reconnection handling'
        ]
      },
      {
        area: 'Complete User Journeys',
        tests: ['e2e-integration.test.tsx'],
        scenarios: [
          'Registration to game completion',
          'Room creation and management',
          'Cross-platform compatibility',
          'Error handling and recovery',
          'Performance under load'
        ]
      }
    ];

    coverageAreas.forEach(area => {
      const relevantTests = this.results.filter(r => 
        area.tests.some(testFile => r.testFile.includes(testFile))
      );
      
      const passedCount = relevantTests.filter(r => r.passed).length;
      const totalCount = relevantTests.length;
      const percentage = totalCount > 0 ? Math.round((passedCount / totalCount) * 100) : 0;
      
      console.log(`   • ${area.area}: ${passedCount}/${totalCount} tests passed (${percentage}%)`);
      
      if (passedCount < totalCount) {
        const failedTests = relevantTests.filter(r => !r.passed);
        failedTests.forEach(test => {
          console.log(`     ❌ ${test.testFile}`);
        });
      }
    });
  }

  private generateDetailedReport(): void {
    const reportPath = path.join(__dirname, '../../../frontend-e2e-test-report.json');
    
    const report = {
      timestamp: new Date().toISOString(),
      platform: 'React Native (iOS/Android)',
      totalDuration: Date.now() - this.startTime,
      summary: {
        total: this.results.length,
        passed: this.results.filter(r => r.passed).length,
        failed: this.results.filter(r => !r.passed).length
      },
      results: this.results.map(result => ({
        testFile: result.testFile,
        passed: result.passed,
        duration: result.duration,
        hasError: !!result.error
      })),
      coverage: {
        userFlows: [
          'Complete registration to game flow',
          'Friend system interactions',
          'Real-time multiplayer gaming',
          'Cross-platform compatibility',
          'Voice chat integration',
          'Offline/online synchronization',
          'Error handling and recovery'
        ],
        components: [
          'Authentication screens',
          'Game lobby interface',
          'Real-time game screen',
          'Friends management',
          'Chat system',
          'Voice controls',
          'Navigation flows'
        ],
        integrations: [
          'Redux state management',
          'Socket.io real-time communication',
          'WebRTC voice chat',
          'API service integration',
          'Local storage persistence',
          'Push notifications',
          'Biometric authentication'
        ]
      },
      performance: {
        averageTestDuration: this.results.reduce((sum, r) => sum + r.duration, 0) / this.results.length,
        slowestTest: this.results.reduce((slowest, current) => 
          current.duration > slowest.duration ? current : slowest
        ),
        fastestTest: this.results.reduce((fastest, current) => 
          current.duration < fastest.duration ? current : fastest
        )
      }
    };

    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n📄 Detailed frontend report saved to: ${reportPath}`);
  }
}

// Run the tests if this script is executed directly
if (require.main === module) {
  const runner = new FrontendE2ETestRunner();
  runner.runAllTests().catch(error => {
    console.error('❌ Frontend test runner failed:', error);
    process.exit(1);
  });
}

export { FrontendE2ETestRunner };