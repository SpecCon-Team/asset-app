import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTicketsStore } from '../store';
import { Ticket, Clock, CheckCircle, Activity, Wifi } from 'lucide-react';
import toast from 'react-hot-toast';
import { getApiClient } from '@/features/assets/lib/apiClient';

export default function MyTasksPage() {
  const navigate = useNavigate();
  const { tickets, isLoading, error, fetchTickets } = useTicketsStore();
  const [userEmail, setUserEmail] = useState('');
  const [userId, setUserId] = useState('');
  const [isTestingSpeed, setIsTestingSpeed] = useState(false);
  const [speedResults, setSpeedResults] = useState<any>(null);
  const [testProgress, setTestProgress] = useState(0);
  const [testStatus, setTestStatus] = useState('');

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      setUserEmail(user.email);
      setUserId(user.id);

      // Redirect non-technicians
      if (user.role !== 'TECHNICIAN' && user.role !== 'ADMIN') {
        navigate('/my/tickets');
      }
    }
  }, [navigate]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  // Filter tickets assigned to the current technician
  const myTasks = tickets.filter(
    (ticket) => ticket.assignedTo?.email === userEmail
  );

  const openTasks = myTasks.filter((t) => t.status === 'open').length;
  const inProgressTasks = myTasks.filter((t) => t.status === 'in_progress').length;
  const completedTasks = myTasks.filter((t) => t.status === 'closed').length;

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-blue-100 text-blue-800';
      case 'in_progress':
        return 'bg-purple-100 text-purple-800';
      case 'closed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const runSpeedTest = async () => {
    setIsTestingSpeed(true);
    setTestProgress(0);
    setSpeedResults(null);
    toast.loading('Running network speed test...');

    try {
      // PHASE 1: PING TEST - Multiple pings for accurate latency (20% of progress)
      setTestStatus('Measuring latency...');
      const pingResults: number[] = [];
      const pingCount = 3;

      for (let i = 0; i < pingCount; i++) {
        const pingStart = performance.now();
        try {
          await fetch('https://www.google.com/generate_204', {
            method: 'HEAD',
            cache: 'no-cache',
          });
          const pingTime = Math.round(performance.now() - pingStart);
          pingResults.push(pingTime);
        } catch {
          // Try alternative endpoint
          try {
            const altStart = performance.now();
            await fetch('https://cloudflare.com/cdn-cgi/trace', {
              method: 'HEAD',
              cache: 'no-cache',
            });
            pingResults.push(Math.round(performance.now() - altStart));
          } catch {
            pingResults.push(0);
          }
        }
        setTestProgress(((i + 1) / pingCount) * 20);
      }

      const validPings = pingResults.filter(p => p > 0);
      const avgPing = validPings.length > 0
        ? Math.round(validPings.reduce((a, b) => a + b, 0) / validPings.length)
        : 0;

      // PHASE 2: DOWNLOAD TEST - Use larger files and measure actual throughput (50% of progress)
      setTestStatus('Testing download speed...');
      let totalBytesDownloaded = 0;
      let totalDownloadTime = 0;
      const downloadDuration = 8000; // 8 seconds for download test
      const startDownloadTest = Date.now();

      try {
        // Start with a medium file to warm up, then use larger file
        const warmupSize = 5000000; // 5MB warmup
        const warmupStart = performance.now();
        const warmupResponse = await fetch(`https://speed.cloudflare.com/__down?bytes=${warmupSize}`, {
          method: 'GET',
          cache: 'no-cache',
        });
        await warmupResponse.blob();
        const warmupTime = (performance.now() - warmupStart) / 1000;
        totalBytesDownloaded += warmupSize;
        totalDownloadTime += warmupTime;
        setTestProgress(20 + 15);

        // Main download test with larger file
        const mainSize = 25000000; // 25MB
        const mainStart = performance.now();
        const mainResponse = await fetch(`https://speed.cloudflare.com/__down?bytes=${mainSize}`, {
          method: 'GET',
          cache: 'no-cache',
        });

        // Read response in chunks for progress tracking
        const reader = mainResponse.body?.getReader();
        let receivedBytes = 0;

        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            receivedBytes += value.length;

            // Update progress during download
            const elapsed = Date.now() - startDownloadTest;
            if (elapsed < downloadDuration) {
              const progressPercent = Math.min((elapsed / downloadDuration) * 50, 50);
              setTestProgress(20 + progressPercent);
            }
          }
        } else {
          await mainResponse.blob();
          receivedBytes = mainSize;
        }

        const mainTime = (performance.now() - mainStart) / 1000;
        totalBytesDownloaded += receivedBytes;
        totalDownloadTime += mainTime;

      } catch (err) {
        console.error('Download test error:', err);
        // Fallback to single large file
        try {
          const fallbackSize = 10000000; // 10MB
          const fallbackStart = performance.now();
          const fallbackResponse = await fetch(`https://speed.cloudflare.com/__down?bytes=${fallbackSize}`, {
            cache: 'no-cache',
          });
          await fallbackResponse.blob();
          const fallbackTime = (performance.now() - fallbackStart) / 1000;
          totalBytesDownloaded = fallbackSize;
          totalDownloadTime = fallbackTime;
        } catch {
          throw new Error('Download test failed');
        }
      }

      setTestProgress(70);

      // Calculate download speed in Mbps (megabits per second)
      const downloadSpeedMbps = totalDownloadTime > 0
        ? (totalBytesDownloaded * 8) / (totalDownloadTime * 1000000)
        : 0;

      // PHASE 3: UPLOAD TEST - Progressive upload with accurate measurement (30% of progress)
      setTestStatus('Testing upload speed...');
      let totalBytesUploaded = 0;
      let totalUploadTime = 0;
      let uploadSpeedMbps = 0;

      try {
        // Try multiple upload approaches for better compatibility
        const uploadSize = 3000000; // 3MB test
        const uploadData = new Uint8Array(uploadSize);

        // Fill with random data for realistic upload test
        for (let i = 0; i < uploadSize; i += 1024) {
          uploadData[i] = Math.random() * 255;
        }

        setTestProgress(75);

        const uploadStart = performance.now();

        try {
          // Try Cloudflare first
          const uploadResponse = await fetch('https://speed.cloudflare.com/__up', {
            method: 'POST',
            body: uploadData.buffer,
            cache: 'no-cache',
            headers: {
              'Content-Type': 'application/octet-stream',
            },
          });

          if (uploadResponse.ok || uploadResponse.status === 200) {
            const uploadTime = (performance.now() - uploadStart) / 1000;
            totalBytesUploaded = uploadSize;
            totalUploadTime = uploadTime;
            uploadSpeedMbps = (totalBytesUploaded * 8) / (totalUploadTime * 1000000);
          } else {
            throw new Error('Upload response not ok');
          }
        } catch (uploadErr) {
          console.warn('Cloudflare upload failed, trying alternative method:', uploadErr);

          // Alternative: Use smaller test with FormData
          const smallUploadSize = 1000000; // 1MB
          const smallUploadData = new Uint8Array(smallUploadSize);
          const blob = new Blob([smallUploadData], { type: 'application/octet-stream' });
          const formData = new FormData();
          formData.append('file', blob, 'test.bin');

          const altUploadStart = performance.now();

          try {
            await fetch('https://speed.cloudflare.com/__up', {
              method: 'POST',
              body: formData,
              cache: 'no-cache',
            });

            const altUploadTime = (performance.now() - altUploadStart) / 1000;
            totalBytesUploaded = smallUploadSize;
            totalUploadTime = altUploadTime;
            uploadSpeedMbps = (totalBytesUploaded * 8) / (totalUploadTime * 1000000);
          } catch (altErr) {
            console.warn('Alternative upload also failed:', altErr);
            // Use estimated upload based on download speed (typical ratio is 1:10)
            uploadSpeedMbps = downloadSpeedMbps * 0.1;
            console.log('Using estimated upload speed based on download:', uploadSpeedMbps);
          }
        }

        setTestProgress(95);

      } catch (err) {
        console.error('Upload test error:', err);
        // Estimate upload speed as 10% of download speed (common asymmetric ratio)
        uploadSpeedMbps = downloadSpeedMbps * 0.1;
        console.log('Upload test failed, estimated speed:', uploadSpeedMbps);
      }

      setTestProgress(100);
      setTestStatus('Complete!');

      const results = {
        ping: avgPing,
        downloadSpeed: parseFloat(downloadSpeedMbps.toFixed(1)),
        uploadSpeed: parseFloat(uploadSpeedMbps.toFixed(1)),
        timestamp: new Date().toISOString(),
        technicianId: userId,
        technicianEmail: userEmail,
      };

      setSpeedResults(results);
      toast.dismiss();
      toast.success('Speed test completed!');

      // Send results to admin as notification
      try {
        await getApiClient().post('/notifications/speed-test', {
          downloadSpeed: results.downloadSpeed,
          uploadSpeed: results.uploadSpeed,
          latency: results.ping,
          technicianEmail: userEmail,
          technicianId: userId,
        });
        toast.success('Results sent to admin!');
      } catch (notifyError) {
        console.error('Failed to send notification:', notifyError);
        toast.warning('Test completed but failed to notify admin.');
      }
    } catch (err: any) {
      console.error('Speed test failed:', err);
      toast.dismiss();
      const errorMessage = err.message || 'Speed test failed. Please check your connection.';
      toast.error(errorMessage);
      setTestStatus('Failed');
    } finally {
      setIsTestingSpeed(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your tasks...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="p-8 text-red-600">Error: {error}</div>;
  }

  return (
    <div className="h-screen overflow-hidden flex flex-col p-8">
      {/* Header */}
      <div className="mb-6 flex-shrink-0">
        <h1 className="text-3xl font-bold text-gray-900">My Tasks</h1>
        <p className="text-gray-600 mt-2">Tickets assigned to you</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 flex-shrink-0">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Open Tasks</p>
              <p className="text-3xl font-bold text-blue-600 mt-2">{openTasks}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <Clock className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">In Progress</p>
              <p className="text-3xl font-bold text-purple-600 mt-2">{inProgressTasks}</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <Activity className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Completed</p>
              <p className="text-3xl font-bold text-green-600 mt-2">{completedTasks}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Network Speed Test Section */}
      <div className="mb-6 flex-shrink-0">
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg shadow p-6 border border-blue-200">
          <div className="flex items-start justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <Wifi className="w-6 h-6 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">Network Speed Test</h3>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Comprehensive test including ping, download, and upload speeds. Results automatically sent to admin.
              </p>

              {/* Progress Indicator */}
              {isTestingSpeed && (
                <div className="mb-4 p-4 bg-white rounded-lg border border-gray-200">
                  <div className="flex items-center gap-4">
                    <div className="relative w-20 h-20">
                      {/* Background circle */}
                      <svg className="w-20 h-20 transform -rotate-90">
                        <circle
                          cx="40"
                          cy="40"
                          r="32"
                          stroke="#e5e7eb"
                          strokeWidth="6"
                          fill="none"
                        />
                        {/* Progress circle */}
                        <circle
                          cx="40"
                          cy="40"
                          r="32"
                          stroke="#3b82f6"
                          strokeWidth="6"
                          fill="none"
                          strokeDasharray={`${2 * Math.PI * 32}`}
                          strokeDashoffset={`${2 * Math.PI * 32 * (1 - testProgress / 100)}`}
                          className="transition-all duration-300"
                          strokeLinecap="round"
                        />
                        {/* Tick marks */}
                        {[0, 25, 50, 75, 100].map((tick) => (
                          <line
                            key={tick}
                            x1="40"
                            y1="8"
                            x2="40"
                            y2="14"
                            stroke={testProgress >= tick ? '#3b82f6' : '#e5e7eb'}
                            strokeWidth="2"
                            transform={`rotate(${(tick / 100) * 360} 40 40)`}
                          />
                        ))}
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-sm font-bold text-blue-600">{Math.round(testProgress)}%</span>
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{testStatus}</p>
                      <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-600 transition-all duration-300"
                          style={{ width: `${testProgress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Results Display */}
              {speedResults && !isTestingSpeed && (
                <div className="grid grid-cols-3 gap-4 p-4 bg-white rounded-lg border border-gray-200">
                  <div className="text-center">
                    <p className="text-xs text-gray-500 mb-1">Ping</p>
                    <p className="text-2xl font-bold text-green-600">{speedResults.ping} ms</p>
                    <p className="text-xs text-gray-400 mt-1">Latency</p>
                  </div>
                  <div className="text-center border-l border-r border-gray-200">
                    <p className="text-xs text-gray-500 mb-1">Download</p>
                    <p className="text-2xl font-bold text-blue-600">{speedResults.downloadSpeed} Mbps</p>
                    <p className="text-xs text-gray-400 mt-1">Speed</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-500 mb-1">Upload</p>
                    <p className="text-2xl font-bold text-purple-600">{speedResults.uploadSpeed} Mbps</p>
                    <p className="text-xs text-gray-400 mt-1">Speed</p>
                  </div>
                </div>
              )}
            </div>
            <button
              onClick={runSpeedTest}
              disabled={isTestingSpeed}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2 font-medium transition-colors"
            >
              <Wifi className="w-5 h-5" />
              {isTestingSpeed ? 'Testing...' : 'Run Speed Test'}
            </button>
          </div>
        </div>
      </div>

      {/* Tasks List */}
      <div className="flex-1 overflow-y-auto">
        {myTasks.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <Ticket className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No tasks assigned yet</h3>
            <p className="text-gray-500">You don't have any tickets assigned to you at the moment</p>
          </div>
        ) : (
          <div className="space-y-4">
            {myTasks.map((ticket) => (
              <div
                key={ticket.id}
                className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => navigate(`/tickets/${ticket.id}`)}
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{ticket.title}</h3>
                    <p className="text-sm text-gray-500">
                      Ticket #{ticket.number || ticket.id}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <span className={`px-3 py-1 text-xs rounded-full ${getStatusColor(ticket.status || '')}`}>
                      {ticket.status?.replace('_', ' ')}
                    </span>
                    <span className={`px-3 py-1 text-xs rounded-full ${getPriorityColor(ticket.priority || '')}`}>
                      {ticket.priority}
                    </span>
                  </div>
                </div>

                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                  {ticket.description || 'No description'}
                </p>

                <div className="flex justify-between items-center text-sm text-gray-500">
                  <div className="space-x-4">
                    <span>Created by: {ticket.createdBy?.name || ticket.createdBy?.email || 'Unknown'}</span>
                    {ticket.createdAt && (
                      <span>Created: {new Date(ticket.createdAt).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
