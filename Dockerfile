# Use Node.js 18 with Debian Bullseye
FROM node:18-bullseye

# Clear apt cache and update package lists with retries
RUN apt-get clean && \
    rm -rf /var/lib/apt/lists/* && \
    for i in 1 2 3; do apt-get update --no-cache --fix-missing && break || sleep 5; done

# Install python3 and python3-pip, ensure pip is available
RUN for i in 1 2 3; do apt-get install -y python3 python3-pip && break || sleep 5; done && \
    python3 -m pip --version || \
    (curl https://bootstrap.pypa.io/get-pip.py -o get-pip.py && python3 get-pip.py && rm get-pip.py)

# Install yt-dlp
RUN pip3 install --no-cache-dir yt-dlp

# Download and install pre-built ffmpeg for ARM64
RUN curl -L https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-arm64-static.tar.xz | tar -xJ -C /tmp && \
    mv /tmp/ffmpeg-*-arm64-static/ffmpeg /usr/local/bin/ && \
    mv /tmp/ffmpeg-*-arm64-static/ffprobe /usr/local/bin/ && \
    chmod +x /usr/local/bin/ffmpeg /usr/local/bin/ffprobe && \
    rm -rf /tmp/ffmpeg-* && \
    ffmpeg -version

# Set working directory
WORKDIR /app

# Copy package.json and install Node.js dependencies
COPY package*.json ./
RUN npm install --no-cache

# Copy the rest of the application
COPY . .

# Expose port 3000
EXPOSE 3000

# Start the server
CMD ["node", "server.js"]