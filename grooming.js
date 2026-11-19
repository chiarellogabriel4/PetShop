
      const petPhotoPool = [
        'https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&w=300&q=80',
        'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&w=300&q=80',
        'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=300&q=80',
        'https://images.unsplash.com/photo-1537151625747-768eb6cf92b2?auto=format&fit=crop&w=300&q=80',
        'https://images.unsplash.com/photo-1576201836106-db1758fd1c97?auto=format&fit=crop&w=300&q=80',
        'https://images.unsplash.com/photo-1511044568932-338cba0ad803?auto=format&fit=crop&w=300&q=80',
        'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&w=300&q=80',
        'https://images.unsplash.com/photo-1507146426996-ef05306b995a?auto=format&fit=crop&w=300&q=80'
      ];

      const petNames = ['Thor', 'Luna', 'Max', 'Sasha', 'Nina', 'Coco'];

      document.querySelectorAll('.pet-photo').forEach((img, index) => {
        const petName = petNames[index] || 'Pet';
        const nameCode = [...petName].reduce((total, char) => total + char.charCodeAt(0), 0);
        const photoIndex = nameCode % petPhotoPool.length;

        img.src = petPhotoPool[photoIndex];
        img.alt = petName;
      });
    