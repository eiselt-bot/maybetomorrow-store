module.exports = {
  apps: [
    {
      name: 'mt-store',
      cwd: '/home/claude-admin/maybetomorrow-store',
      script: 'npm',
      args: 'run start',
      env: {
        NODE_ENV: 'production',
        PORT: 3003,
      },
      instances: 1,
      exec_mode: 'fork',
      max_memory_restart: '512M',
      error_file: '/home/claude-admin/.pm2/logs/mt-store-error.log',
      out_file: '/home/claude-admin/.pm2/logs/mt-store-out.log',
      merge_logs: true,
      autorestart: true,
      watch: false,
    },
  ],
};
