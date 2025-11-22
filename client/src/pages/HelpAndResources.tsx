import React, { useState, useEffect } from 'react';
import {
  HelpCircle,
  BookOpen,
  Video,
  MessageCircle,
  Mail,
  Phone,
  FileText,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  Search
} from 'lucide-react';
import { LoadingOverlay, useMinLoadingTime } from '@/components/LoadingSpinner';

export default function HelpAndResources() {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const showLoading = useMinLoadingTime(isLoading, 2000);

  useEffect(() => {
    // Simulate initial load
    setIsLoading(false);
  }, []);

  const faqs = [
    {
      question: 'How do I create a new asset?',
      answer: 'Go to the Assets page and click the "+ Add Asset" button. Fill in the required information including asset code, name, type, and status. You can also assign the asset to a user and add additional details like serial number, purchase date, and notes.'
    },
    {
      question: 'How do I import multiple assets at once?',
      answer: 'Navigate to the Assets page and click "Template" to download the CSV template. Fill in your asset data following the example format, then click "Import CSV" to upload your file. The system will validate and import all assets in bulk.'
    },
    {
      question: 'How do I create and assign tickets?',
      answer: 'Go to the Tickets page and click "+ New Ticket". Enter the title, description, priority, and optionally link it to an asset. You can assign the ticket to a technician or leave it unassigned for the admin to assign later.'
    },
    {
      question: 'How do I export data to CSV?',
      answer: 'On the Assets or Tickets page, click the "Export CSV" button. This will download a CSV file with all your data including detailed information about each item. You can open this file in Excel or any spreadsheet application.'
    },
    {
      question: 'How do I change my password?',
      answer: 'Click on your profile picture in the top right, select "General settings", then scroll to the "Change Password" section. Enter your current password and your new password (must be at least 12 characters), then click "Update Password".'
    },
    {
      question: 'How do I update my availability status?',
      answer: 'Click on your profile picture in the top right corner. You\'ll see an "Available" toggle switch. Click it to change your status between available (online) and offline. This helps others know when you\'re available to handle tickets.'
    },
    {
      question: 'What are the different user roles?',
      answer: 'There are three roles: Admin (full access to all features), Technician (can manage tickets and view assets), and User (can view their own assets and create tickets). Contact your admin to change your role.'
    },
    {
      question: 'How do I scan QR codes for assets?',
      answer: 'On the asset details page, you can generate a QR code for quick access. Use the mobile app (coming soon) to scan QR codes and instantly view or update asset information.'
    }
  ];

  const resources = [
    {
      icon: BookOpen,
      title: 'User Guide',
      description: 'Complete documentation and tutorials',
      link: '#'
    },
    {
      icon: Video,
      title: 'Video Tutorials',
      description: 'Step-by-step video guides',
      link: '#'
    },
    {
      icon: FileText,
      title: 'API Documentation',
      description: 'For developers and integrations',
      link: '#'
    },
    {
      icon: MessageCircle,
      title: 'Community Forum',
      description: 'Ask questions and share tips',
      link: '#'
    }
  ];

  const filteredFaqs = faqs.filter(
    faq =>
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (showLoading) {
    return <LoadingOverlay message="Loading help resources..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mb-6">
            <HelpCircle className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Help & Resources
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Find answers, learn tips, and get the most out of your Asset Management System
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-12">
          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search for help..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:text-white text-lg"
            />
          </div>
        </div>

        {/* Quick Links */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {resources.map((resource, index) => {
            const Icon = resource.icon;
            return (
              <a
                key={index}
                href={resource.link}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 hover:shadow-xl transition-all hover:-translate-y-1 group"
              >
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mb-4 group-hover:bg-blue-200 dark:group-hover:bg-blue-900/50 transition-colors">
                  <Icon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center justify-between">
                  {resource.title}
                  <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-blue-600" />
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {resource.description}
                </p>
              </a>
            );
          })}
        </div>

        {/* FAQs */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 mb-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            {filteredFaqs.length > 0 ? (
              filteredFaqs.map((faq, index) => (
                <div
                  key={index}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
                >
                  <button
                    onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                    className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <span className="font-medium text-gray-900 dark:text-white pr-4">
                      {faq.question}
                    </span>
                    {expandedFaq === index ? (
                      <ChevronDown className="w-5 h-5 text-gray-500 flex-shrink-0" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-gray-500 flex-shrink-0" />
                    )}
                  </button>
                  {expandedFaq === index && (
                    <div className="px-4 pb-4 text-gray-600 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700 pt-4">
                      {faq.answer}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                No FAQs found matching "{searchQuery}"
              </p>
            )}
          </div>
        </div>

        {/* Contact Support */}
        <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg shadow-lg p-8 text-white">
          <h2 className="text-2xl font-bold mb-4">Still Need Help?</h2>
          <p className="text-blue-100 mb-6">
            Our support team is here to help you. Reach out to us through any of these channels:
          </p>
          <div className="grid md:grid-cols-3 gap-4">
            <a
              href="mailto:support@assetapp.com"
              className="bg-white/10 hover:bg-white/20 backdrop-blur rounded-lg p-4 transition-colors flex items-center gap-3"
            >
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <div className="font-semibold text-sm">Email</div>
                <div className="text-xs text-blue-100">support@assetapp.com</div>
              </div>
            </a>
            <a
              href="tel:+1234567890"
              className="bg-white/10 hover:bg-white/20 backdrop-blur rounded-lg p-4 transition-colors flex items-center gap-3"
            >
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <Phone className="w-5 h-5" />
              </div>
              <div>
                <div className="font-semibold text-sm">Phone</div>
                <div className="text-xs text-blue-100">+1 (234) 567-890</div>
              </div>
            </a>
            <a
              href="#"
              className="bg-white/10 hover:bg-white/20 backdrop-blur rounded-lg p-4 transition-colors flex items-center gap-3"
            >
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <MessageCircle className="w-5 h-5" />
              </div>
              <div>
                <div className="font-semibold text-sm">Live Chat</div>
                <div className="text-xs text-blue-100">Available 24/7</div>
              </div>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
