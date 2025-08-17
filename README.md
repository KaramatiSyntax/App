# Turrani Esports is now TurraniX!

## Match Card Component

A reusable match card component for displaying match details.

## Version 1.1.0

### Bug Fixes

* Fixed issue with SlotBooker and RoomIdPassModal not loading properly
* Fixed issue with MatchDetailsDialog not closing properly
* Improved smoothness of component rendering

### New Features

* Added Dialog component from `@/components/ui/dialog` to wrap SlotBooker
* Added close button with cross icon to top right corner of dialog
* Improved handling of state variables for showSlotBooker and showRoomModal

### Changes

* Updated MatchCard.jsx to handle opening and closing of SlotBooker and RoomIdPassModal
* Updated SlotBooker.jsx to render inside Dialog component
* Updated RoomIdPassModal.jsx to render properly

## Installation

To install the Match Card Component, run the following command:

```bash
npm install