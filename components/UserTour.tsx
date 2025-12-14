import React, { useState, useEffect } from 'react';
import ReactJoyride, { CallBackProps, STATUS, Step, Styles } from 'react-joyride';
import { User } from '../types';

interface UserTourProps {
  currentUser: User;
}

const UserTour: React.FC<UserTourProps> = ({ currentUser }) => {
  const [run, setRun] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Check if user has already seen the tour
    const hasSeenTour = localStorage.getItem(`tour_seen_${currentUser.id}`);
    if (!hasSeenTour) {
      // Small delay to ensure DOM is ready and prevent hydration mismatches
      const timer = setTimeout(() => {
          setRun(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [currentUser.id]);

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status } = data;
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];

    if (finishedStatuses.includes(status)) {
      setRun(false);
      localStorage.setItem(`tour_seen_${currentUser.id}`, 'true');
    }
  };

  // Define steps
  const steps: Step[] = [
    {
      content: (
        <div className="text-center">
          <h2 className="font-bold text-xl mb-2">Chào mừng đến với QuizEdu! 👋</h2>
          <p>Hãy để chúng tôi hướng dẫn bạn các chức năng chính nhé.</p>
        </div>
      ),
      placement: 'center',
      target: 'body',
    },
    {
      target: '#sidebar-dashboard',
      content: 'Đây là trang chủ, nơi bạn xem tổng quan và bảng xếp hạng thành tích.',
    },
    {
      target: '#sidebar-library',
      content: 'Truy cập thư viện để xem tất cả các học phần của bạn và cộng đồng.',
    },
    {
      target: '#sidebar-classes',
      content: 'Quản lý lớp học, giao bài tập và xem kết quả của học sinh tại đây.',
    },
    {
      target: '#sidebar-create',
      content: 'Tự tạo bộ thẻ ghi nhớ (Flashcards) mới thủ công tại đây.',
    },
  ];

  // Add teacher-specific steps
  if (currentUser.role === 'TEACHER') {
    steps.splice(4, 0, {
      target: '#sidebar-ai_creator',
      content: (
        <div>
          <strong className="text-indigo-600 block mb-1">✨ Tính năng đặc biệt</strong>
          Tải lên tài liệu PDF hoặc Sách giáo khoa, AI sẽ tự động soạn bài giảng và câu hỏi cho bạn.
        </div>
      ),
    });
  }

  // Add dashboard specific steps (assuming we start on dashboard)
  steps.push({
    target: '#dashboard-create-btn',
    content: 'Nút tắt để tạo nhanh học phần mới ngay từ trang chủ.',
  });

  const tourStyles: Partial<Styles> = {
    options: {
      arrowColor: '#4f46e5',
      backgroundColor: '#fff',
      overlayColor: 'rgba(0, 0, 0, 0.5)',
      primaryColor: '#4f46e5',
      textColor: '#333',
      width: 400,
      zIndex: 1000,
    },
    tooltip: {
      borderRadius: '16px',
      padding: '20px',
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    },
    buttonNext: {
      backgroundColor: '#4f46e5',
      borderRadius: '8px',
      color: '#fff',
      fontWeight: 'bold',
      padding: '10px 20px',
    },
    buttonBack: {
      color: '#6b7280',
      marginRight: 10,
    },
    buttonSkip: {
      color: '#9ca3af',
    }
  };

  if (!mounted) return null;

  return (
    <ReactJoyride
      steps={steps}
      run={run}
      continuous
      showProgress
      showSkipButton
      styles={tourStyles}
      callback={handleJoyrideCallback}
      locale={{
        back: 'Quay lại',
        close: 'Đóng',
        last: 'Hoàn tất',
        next: 'Tiếp theo',
        skip: 'Bỏ qua',
      }}
    />
  );
};

export default UserTour;