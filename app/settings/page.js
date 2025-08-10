'use client';

import React from 'react';
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pencil, Save, X, User, Settings, HelpCircle, MessageSquare, Shield, FileText, LogOut, ArrowLeft, Bell, Eye, EyeOff } from "lucide-react";
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import CustomAlert from "@/components/CustomAlert";
import { useRouter, useSearchParams } from 'next/navigation';
import PushNotificationPermission from "@/components/PushNotificationPermission";
import { Mail, Instagram } from 'lucide-react'; 
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useUserData } from "@/lib/hooks/useUserData";

// Blue tick SVG component for settings
function BlueTick({ size = '1em', onClick }) {
  return (
    <span className="inline-block align-middle ml-1" title="Verified" onClick={onClick}>
      <svg className={`inline text-blue-500`} style={{ width: size, height: size }} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" fill="#2563eb" />
        <path d="M8.5 12.5l2.2 2.2 4.3-4.4" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { userData, loading, refreshUserData } = useUserData();
  const [isEditing, setIsEditing] = useState(false);
  const [alert, setAlert] = useState({ isOpen: false, type: 'info', title: '', message: '' });
  const [activeTab, setActiveTab] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    firstName: '',
    lastName: '',
    email: '',
    password: '',
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);

  // Pre-fill form fields with user data when dialog opens
  useEffect(() => {
    if (activeTab === 'edit-profile' && userData) {
      setFormData({
        username: userData.username || '',
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        email: userData.email || '',
        password: '',
      });
    }
  }, [activeTab, userData]);

  useEffect(() => {
    const initialTab = searchParams.get('tab');
    if (initialTab === 'rules') {
      setActiveTab('rules');
      setIsDialogOpen(true);
    }
  }, [searchParams]);

  const handleEdit = () => setIsEditing(true);
  const handleCancel = () => {
    setIsEditing(false);
    setFormData({
      username: '', // Placeholder, will be replaced with actual user data
      firstName: '', // Placeholder, will be replaced with actual user data
      lastName: '', // Placeholder, will be replaced with actual user data
      email: '', // Placeholder, will be replaced with actual user data
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/users/${userData._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          firstName: formData.firstName,
          lastName: formData.lastName,
          password: formData.password ? formData.password : undefined,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        showAlert('success', 'Profile Updated', 'Your profile has been updated successfully!');
        setIsEditing(false);
        setFormData({ ...formData, password: '' });
        refreshUserData && refreshUserData();
        setIsDialogOpen(false);
      } else {
        showAlert('error', 'Update Failed', data.error || 'Failed to update profile.');
      }
    } catch (err) {
      showAlert('error', 'Network Error', 'Failed to update profile. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const showAlert = (type, title, message) => {
    setAlert({ isOpen: true, type, title, message });
  };

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/queries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: contactForm.name,
          email: contactForm.email,
          subject: contactForm.subject,
          message: contactForm.message,
          status: 'unread'
        }),
      });

      if (response.ok) {
        showAlert('success', 'Message Sent!', 'Your message has been sent successfully. We will get back to you soon.');
        setContactForm({ name: '', email: '', subject: '', message: '' });
        setIsDialogOpen(false);
      } else {
        throw new Error('Failed to send message');
      }
    } catch (error) {
      showAlert('error', 'Error', 'Failed to send message. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openTab = (tabId) => {
    setActiveTab(tabId);
    setIsDialogOpen(true);
  };

  if (!userData) {
    return (
      <div className="min-h-screen  flex items-center justify-center">
        <Card className="p-8 rounded-3xl border border-white/20 bg-white/10 backdrop-blur-[12px] shadow-2xl">
          <div className="text-center space-y-4">
            <h1 className="text-2xl font-bold text-white">Sign in to access settings</h1>
          </div>
        </Card>
      </div>
    );
  }

  const tabs = [
    { id: 'account', label: 'Account Settings', icon: User, color: 'text-blue-500' },
    { id: 'edit-profile', label: 'Edit Profile', icon: Pencil, color: 'text-green-500' },
    { id: 'contact', label: 'Contact', icon: MessageSquare, color: 'text-purple-500' },
    { id: 'signout', label: 'Sign Out', icon: LogOut, color: 'text-red-500' }
  ];

  return (
        <div className="pt-8 pb-20 p-2 min-h-screen">
      {/* Settings Title */}
      <div className="text-center mb-4">
        <h1 className="text-2xl font-bold text-white">Settings</h1>
      </div>
      {/* Settings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 p-4">
        {tabs.filter(tab => tab.id !== 'signout').map((tab) => {
          const IconComponent = tab.icon;
          return (
            <motion.button
              key={tab.id}
              onClick={() => openTab(tab.id)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`p-6 rounded-xl border border-white/20 bg-white/10 hover:bg-white/20 transition-all duration-200 text-left group`}
            >
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-lg bg-white/10 ${tab.color} group-hover:scale-110 transition-transform duration-200`}>
                  <IconComponent className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-white group-hover:text-blue-400 transition-colors">
                    {tab.label}
                  </h3>
                  <p className="text-sm text-white/70 mt-1">
                    {tab.id === 'account' && 'View account information'}
                    {tab.id === 'edit-profile' && 'Update your profile'}
                    {tab.id === 'contact' && 'Get in touch with us'}
                    {tab.id === 'legal' && 'Legal and compliance information'}
                  </p>
                </div>
              </div>
            </motion.button>
          );
        })}
        {/* About Us Card */}
        <Link href="/settings/about-us" className="p-6 rounded-xl border border-white/20 bg-white/10 hover:bg-white/20 transition-all duration-200 text-left group flex items-center gap-4">
          <div className="p-3 rounded-lg bg-white/10 text-pink-500 group-hover:scale-110 transition-transform duration-200">
            <HelpCircle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-semibold text-white group-hover:text-pink-400 transition-colors">About Us</h3>
            <p className="text-sm text-white/70 mt-1">Learn more about Turrani Esports</p>
          </div>
        </Link>
        {/* Rules Card */}
        <Link href="/settings/rules" className="p-6 rounded-xl border border-white/20 bg-white/10 hover:bg-white/20 transition-all duration-200 text-left group flex items-center gap-4">
          <div className="p-3 rounded-lg bg-white/10 text-blue-500 group-hover:scale-110 transition-transform duration-200">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-semibold text-white group-hover:text-blue-400 transition-colors">Rules</h3>
            <p className="text-sm text-white/70 mt-1">Tournament rules and guidelines</p>
          </div>
        </Link>
        {/* Legal & Compliance Card */}
        <Link href="/settings/legal" className="p-6 rounded-xl border border-white/20 bg-white/10 hover:bg-white/20 transition-all duration-200 text-left group flex items-center gap-4">
          <div className="p-3 rounded-lg bg-white/10 text-indigo-500 group-hover:scale-110 transition-transform duration-200">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-semibold text-white group-hover:text-indigo-400 transition-colors">Legal & Compliance</h3>
            <p className="text-sm text-white/70 mt-1">Privacy Policy and Terms of Service</p>
          </div>
        </Link>
        {/* Sign Out Button as last card */}
        <motion.button
          key="signout"
          onClick={() => openTab('signout')}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="p-6 rounded-xl border border-white/20 bg-white/10 hover:bg-white/20 transition-all duration-200 text-left group"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-white/10 text-red-500 group-hover:scale-110 transition-transform duration-200">
              <LogOut className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-semibold text-white group-hover:text-red-400 transition-colors">Sign Out</h3>
              <p className="text-sm text-white/70 mt-1">Sign out of your account</p>
            </div>
          </div>
        </motion.button>
      </div>

        {/* Tab Content Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-xs p-2 text-xs sm:max-w-sm sm:p-4 sm:text-sm max-h-[90vh] overflow-y-auto bg-white/10 backdrop-blur-md border-white/20 rounded-xl mt-2">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
                {tabs.find(tab => tab.id === activeTab)?.icon && 
                  React.createElement(tabs.find(tab => tab.id === activeTab)?.icon, { 
                    className: `w-5 h-5 ${tabs.find(tab => tab.id === activeTab)?.color}` 
                  })
                }
                {tabs.find(tab => tab.id === activeTab)?.label}
              </DialogTitle>
            </DialogHeader>
            
            <div className="mt-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  {activeTab === 'account' && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-white">Username</Label>
                          <div className="mt-1 p-3 bg-white/10 rounded-lg text-white/70 flex items-center">
                            {userData.username || 'Not set'}
                            {userData.isVerified && <BlueTick size="1em" />}
                          </div>
                        </div>
                        <div>
                          <Label className="text-white">Email</Label>
                          <div className="mt-1 p-3 bg-white/10 rounded-lg text-white/70">
                            {userData.email}
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-white">First Name</Label>
                          <div className="mt-1 p-3 bg-white/10 rounded-lg text-white/70">
                            {userData.firstName || 'Not set'}
                          </div>
                        </div>
                        <div>
                          <Label className="text-white">Last Name</Label>
                          <div className="mt-1 p-3 bg-white/10 rounded-lg text-white/70">
                            {userData.lastName || 'Not set'}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'edit-profile' && (
                    <div className="space-y-6">
                      <form onSubmit={handleSave} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="username" className="text-white">Username</Label>
                            <Input
                              id="username"
                              name="username"
                              value={formData.username}
                              onChange={handleChange}
                              className="mt-1"
                              required
                            />
                          </div>
                          <div>
                            <Label htmlFor="email" className="text-white">Email</Label>
                            <Input
                              id="email"
                              name="email"
                              type="email"
                              value={formData.email}
                              onChange={handleChange}
                              className="mt-1"
                              required
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="firstName" className="text-white">First Name</Label>
                            <Input
                              id="firstName"
                              name="firstName"
                              value={formData.firstName}
                              onChange={handleChange}
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label htmlFor="lastName" className="text-white">Last Name</Label>
                            <Input
                              id="lastName"
                              name="lastName"
                              value={formData.lastName}
                              onChange={handleChange}
                              className="mt-1"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="password" className="text-white">New Password</Label>
                            <Input
                              id="password"
                              name="password"
                              type="password"
                              value={formData.password}
                              onChange={handleChange}
                              className="mt-1"
                              autoComplete="new-password"
                              placeholder="Leave blank to keep current"
                            />
                          </div>
                        </div>
                        <div className="flex gap-3">
                          <Button type="submit" className="bg-blue-500 hover:bg-blue-600" disabled={isSubmitting}>
                            <Save className="w-4 h-4 mr-2" />
                            {isSubmitting ? 'Saving...' : 'Save Changes'}
                          </Button>
                          <Button type="button" variant="outline" onClick={handleCancel} disabled={isSubmitting}>
                            <X className="w-4 h-4 mr-2" />
                            Cancel
                          </Button>
                        </div>
                      </form>
                    </div>
                  )}

                  {activeTab === 'notifications' && (
                    <div className="space-y-6">
                      <PushNotificationPermission />
                    </div>
                  )}

                 {activeTab === 'contact' && (
  <div className="space-y-6">
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-white">Send us a Message</h3>
      <form onSubmit={handleContactSubmit} className="space-y-4">
        <div>
          <Label htmlFor="name" className="text-white">Name</Label>
          <Input
            id="name"
            value={contactForm.name}
            onChange={(e) => setContactForm(prev => ({ ...prev, name: e.target.value }))}
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="email" className="text-white">Email</Label>
          <Input
            id="email"
            type="email"
            value={contactForm.email}
            onChange={(e) => setContactForm(prev => ({ ...prev, email: e.target.value }))}
            required
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="subject" className="text-white">Subject</Label>
          <Input
            id="subject"
            value={contactForm.subject}
            onChange={(e) => setContactForm(prev => ({ ...prev, subject: e.target.value }))}
            required
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="message" className="text-white">Message</Label>
          <textarea
            id="message"
            value={contactForm.message}
            onChange={(e) => setContactForm(prev => ({ ...prev, message: e.target.value }))}
            required
            rows={4}
            className="mt-1 w-full p-3 border border-white/20 rounded-lg bg-white/10 text-white resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>
        <Button type="submit" disabled={isSubmitting} className="w-full bg-blue-500 hover:bg-blue-600 text-sm py-2">
          {isSubmitting ? 'Sending...' : 'Send Message'}
        </Button>
      </form>
    </div>
  </div>
)}

      

                  {activeTab === 'signout' && (
                    <div className="space-y-6">
                      <div className="text-center space-y-4">
                        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto">
                          <LogOut className="w-8 h-8 text-red-500" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-white mb-2">Are you sure you want to sign out?</h3>
                          <p className="text-white/70">You will be logged out of your account and redirected to the home page.</p>
                        </div>
                        <div className="flex gap-3 justify-center pt-4">
                          <Button
                            className="bg-red-500 hover:bg-red-600"
                            onClick={async () => {
                              setIsSubmitting(true);
                              try {
                                const response = await fetch('/api/auth/logout', {
                                  method: 'POST',
                                  credentials: 'include',
                                });
                                if (typeof window !== 'undefined') {
                                  localStorage.clear();
                                  sessionStorage.clear();
                                }
                                if (response.ok) {
                                  window.location.href = '/login';
                                } else {
                                  window.location.href = '/login';
                                }
                              } catch (error) {
                                if (typeof window !== 'undefined') {
                                  localStorage.clear();
                                  sessionStorage.clear();
                                }
                                window.location.href = '/login';
                              } finally {
                                setIsSubmitting(false);
                              }
                            }}
                            disabled={isSubmitting}
                          >
                            <LogOut className="w-4 h-4 mr-2" />
                            {isSubmitting ? 'Signing Out...' : 'Sign Out'}
                          </Button>
                          <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSubmitting}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </DialogContent>
        </Dialog>

        {/* Custom Alert */}
        <CustomAlert
          isOpen={alert.isOpen}
          onClose={() => setAlert({ ...alert, isOpen: false })}
          type={alert.type}
          title={alert.title}
          message={alert.message}
        />
    </div>
  );
} 
