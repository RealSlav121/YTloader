# Use Node.js 18 with Debian Bullseye
FROM node:18-bullseye

# Clear apt cache and update package lists with retries
RUN apt-get clean && \
    rm -rf /var/lib/apt/lists/* && \
    echo "deb http://deb.debian.org/debian bullseye main contrib non-free" > /etc/apt/sources.list && \
    echo "deb http://deb.debian.org/debian bullseye-updates main contrib non-free" >> /etc/apt/sources.list && \
    echo "deb http://deb.debian.org/debian-security bullseye-security main contrib non-free" >> /etc/apt/sources.list && \
    for i in 1 2 3; do apt-get update && break || sleep 5; done

# Install python3 and python3-pip
RUN for i in 1 2 3; do apt-get install -y python3 python3-pip && break || sleep 5; done && \
    python3 -m pip --version

# Install yt-dlp
RUN pip3 install --no-cache-dir yt-dlp

# Download and install pre-built ffmpeg for x86_64
RUN curl -L https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz | tar -xJ -C /tmp && \
    mv /tmp/ffmpeg-*-amd64-static/ffmpeg /usr/local/bin/ && \
    mv /tmp/ffmpeg-*-amd64-static/ffprobe /usr/local/bin/ && \
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