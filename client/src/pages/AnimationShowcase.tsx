import React, { useState } from 'react';
import { Card, CardBody, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { LoadingSpinner, LoadingOverlay, SkeletonLoader, ListSkeleton } from '../components/LoadingSpinner';
import { CheckCircle, XCircle, AlertCircle, Loader2, Sparkles } from 'lucide-react';

/**
 * Animation Showcase Page
 * Demonstrates all available animations and effects
 *
 * This page can be used as:
 * 1. Reference for developers
 * 2. Testing animations
 * 3. Client demonstration
 */
export default function AnimationShowcase() {
  const [showOverlay, setShowOverlay] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [showSkeleton, setShowSkeleton] = useState(false);

  const fadeAnimations = [
    { name: 'Fade In', class: 'animate-fade-in' },
    { name: 'Fade In Up', class: 'animate-fade-in-up' },
    { name: 'Fade In Down', class: 'animate-fade-in-down' },
    { name: 'Fade In Left', class: 'animate-fade-in-left' },
    { name: 'Fade In Right', class: 'animate-fade-in-right' },
  ];

  const scaleAnimations = [
    { name: 'Scale In', class: 'animate-scale-in' },
    { name: 'Bounce', class: 'animate-bounce' },
  ];

  const specialEffects = [
    { name: 'Pulse', class: 'animate-pulse' },
    { name: 'Spin', class: 'animate-spin' },
    { name: 'Glow', class: 'animate-glow' },
  ];

  const hoverEffects = [
    { name: 'Lift', class: 'hover-lift' },
    { name: 'Grow', class: 'hover-grow' },
    { name: 'Glow', class: 'hover-glow' },
  ];

  const demoItems = ['Item 1', 'Item 2', 'Item 3', 'Item 4', 'Item 5'];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="animate-fade-in-down">
          <div className="flex items-center gap-3 mb-2">
            <Sparkles className="w-8 h-8 text-primary animate-pulse" />
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
              Animation Showcase
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-300">
            Explore all available animations and effects in the design system
          </p>
        </div>

        {/* Fade Animations */}
        <Card className="animate-fade-in-up">
          <CardHeader>
            <CardTitle>Fade Animations</CardTitle>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Smooth fade transitions from different directions
            </p>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {fadeAnimations.map((anim) => (
                <div
                  key={anim.name}
                  className={`${anim.class} p-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-2 border-blue-200 dark:border-blue-700 text-center`}
                >
                  <p className="font-medium text-gray-900 dark:text-white">{anim.name}</p>
                  <code className="text-xs text-gray-600 dark:text-gray-400 mt-1 block">
                    {anim.class}
                  </code>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>

        {/* Scale & Bounce */}
        <Card className="animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <CardHeader>
            <CardTitle>Scale & Bounce</CardTitle>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Scale and bounce effects for attention-grabbing elements
            </p>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {scaleAnimations.map((anim) => (
                <div
                  key={anim.name}
                  className={`${anim.class} p-8 bg-green-50 dark:bg-green-900/20 rounded-lg border-2 border-green-200 dark:border-green-700 text-center`}
                >
                  <p className="font-medium text-gray-900 dark:text-white">{anim.name}</p>
                  <code className="text-xs text-gray-600 dark:text-gray-400 mt-1 block">
                    {anim.class}
                  </code>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>

        {/* Special Effects */}
        <Card className="animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          <CardHeader>
            <CardTitle>Special Effects</CardTitle>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Continuous animations for loading states and emphasis
            </p>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {specialEffects.map((anim) => (
                <div
                  key={anim.name}
                  className={`p-8 bg-purple-50 dark:bg-purple-900/20 rounded-lg border-2 border-purple-200 dark:border-purple-700 text-center`}
                >
                  <div className={`${anim.class} inline-block w-12 h-12 bg-purple-500 rounded-full`} />
                  <p className="font-medium text-gray-900 dark:text-white mt-4">{anim.name}</p>
                  <code className="text-xs text-gray-600 dark:text-gray-400 mt-1 block">
                    {anim.class}
                  </code>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>

        {/* Hover Effects */}
        <Card className="animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
          <CardHeader>
            <CardTitle>Hover Effects</CardTitle>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Interactive effects that respond to mouse hover
            </p>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {hoverEffects.map((anim) => (
                <div
                  key={anim.name}
                  className={`${anim.class} p-8 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border-2 border-yellow-200 dark:border-yellow-700 text-center cursor-pointer transition-all duration-200`}
                >
                  <p className="font-medium text-gray-900 dark:text-white">Hover Me</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{anim.name}</p>
                  <code className="text-xs text-gray-500 dark:text-gray-500 mt-1 block">
                    {anim.class}
                  </code>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>

        {/* Staggered List */}
        <Card className="animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
          <CardHeader>
            <CardTitle>Staggered List Animation</CardTitle>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              List items appear with sequential delays
            </p>
          </CardHeader>
          <CardBody>
            <ul className="stagger-children space-y-3">
              {demoItems.map((item, index) => (
                <li
                  key={index}
                  className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg hover-lift cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-bold">
                      {index + 1}
                    </div>
                    <span className="font-medium text-gray-900 dark:text-white">{item}</span>
                  </div>
                </li>
              ))}
            </ul>
            <code className="text-xs text-gray-600 dark:text-gray-400 mt-4 block">
              className="stagger-children"
            </code>
          </CardBody>
        </Card>

        {/* Loading States */}
        <Card className="animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
          <CardHeader>
            <CardTitle>Loading States</CardTitle>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Various loading indicators and skeleton screens
            </p>
          </CardHeader>
          <CardBody>
            <div className="space-y-6">
              {/* Shimmer Skeleton */}
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">Shimmer Skeleton</h4>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowSkeleton(!showSkeleton)}
                >
                  {showSkeleton ? 'Hide' : 'Show'} Skeleton
                </Button>
                {showSkeleton && (
                  <div className="mt-4 space-y-3">
                    <SkeletonLoader className="h-20 w-full" />
                    <SkeletonLoader className="h-20 w-3/4" />
                    <SkeletonLoader className="h-20 w-1/2" />
                  </div>
                )}
              </div>

              {/* Loading Overlay */}
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">Loading Overlay</h4>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    setShowOverlay(true);
                    setTimeout(() => setShowOverlay(false), 2000);
                  }}
                >
                  Show Overlay (2s)
                </Button>
              </div>

              {/* Spinner */}
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">Inline Spinner</h4>
                <div className="flex items-center gap-4">
                  <LoadingSpinner size="sm" />
                  <LoadingSpinner size="md" />
                  <LoadingSpinner size="lg" />
                </div>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Interactive Buttons */}
        <Card className="animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
          <CardHeader>
            <CardTitle>Interactive Buttons</CardTitle>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Buttons with hover lift, shadows, and feedback
            </p>
          </CardHeader>
          <CardBody>
            <div className="space-y-6">
              {/* Button Variants */}
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">Button Variants</h4>
                <div className="flex flex-wrap gap-3">
                  <Button variant="primary" size="md">
                    Primary
                  </Button>
                  <Button variant="secondary" size="md">
                    Secondary
                  </Button>
                  <Button variant="success" size="md">
                    Success
                  </Button>
                  <Button variant="danger" size="md">
                    Danger
                  </Button>
                  <Button variant="ghost" size="md">
                    Ghost
                  </Button>
                </div>
              </div>

              {/* Loading States */}
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">Loading States</h4>
                <div className="flex flex-wrap gap-3">
                  <Button variant="primary" isLoading disabled>
                    Loading...
                  </Button>
                  <Button variant="success" isLoading disabled>
                    Processing...
                  </Button>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Success/Error States */}
        <Card className="animate-fade-in-up" style={{ animationDelay: '0.7s' }}>
          <CardHeader>
            <CardTitle>Success & Error States</CardTitle>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Animated feedback for user actions
            </p>
          </CardHeader>
          <CardBody>
            <div className="space-y-4">
              {/* Success */}
              <div>
                <Button
                  variant="success"
                  size="sm"
                  onClick={() => {
                    setShowSuccess(true);
                    setTimeout(() => setShowSuccess(false), 3000);
                  }}
                >
                  Show Success
                </Button>
                {showSuccess && (
                  <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg animate-scale-in">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                      <div>
                        <p className="font-medium text-green-900 dark:text-green-100">Success!</p>
                        <p className="text-sm text-green-700 dark:text-green-300">
                          Your action completed successfully
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Error */}
              <div>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => {
                    setShowError(true);
                    setTimeout(() => setShowError(false), 3000);
                  }}
                >
                  Show Error
                </Button>
                {showError && (
                  <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg animate-shake">
                    <div className="flex items-center gap-3">
                      <XCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                      <div>
                        <p className="font-medium text-red-900 dark:text-red-100">Error!</p>
                        <p className="text-sm text-red-700 dark:text-red-300">
                          Something went wrong. Please try again.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Code Example */}
        <Card className="animate-fade-in-up" style={{ animationDelay: '0.8s' }}>
          <CardHeader>
            <CardTitle>Quick Start Code</CardTitle>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Copy and paste these examples
            </p>
          </CardHeader>
          <CardBody>
            <div className="space-y-4">
              <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                <code>{`// Animated Card
<Card className="animate-fade-in-up hover-lift">
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardBody>Content</CardBody>
</Card>

// Loading Overlay
import { LoadingOverlay } from '@/components/LoadingSpinner';
{isLoading && <LoadingOverlay message="Loading..." />}

// Staggered List
<ul className="stagger-children">
  {items.map(item => (
    <li key={item.id}>{item.name}</li>
  ))}
</ul>

// Error with Shake
<div className="animate-shake">
  <Alert variant="error">Error message</Alert>
</div>`}</code>
              </pre>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Loading Overlay Demo */}
      {showOverlay && <LoadingOverlay message="Processing your request..." />}
    </div>
  );
}
